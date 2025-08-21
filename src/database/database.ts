import {Base64} from '../modules/base64';
import {DbCrypto} from './db-crypto';
import {DbData, getDefaultCryptoParams} from './db-data';
import {DbStorage} from './db-storage';
import {DbDocument, DbModel, DbEntry, CryptoParams} from './db-types';

export enum DbState {
  INITIAL,  // Initial state before fetching for the first time.
  FETCHING,  // The database is currently being fetched.
  MISSING,  // No database created yet on the storage backend.
  LOCKED,  // The database was downloaded and is in locked (encrypted) state.
  UNLOCKED,  // The database was downloaded and unlocked (decrypted).
}

// Error type for all rejected Promises in this class.
export interface DatabaseError {
  code: string;
  message: string;
}

export type DbStateListener = (status: DbState) => void;

// The main database API that glues together the storage backend, the
// cryptographic functions and the data representation.
export class Database {
  private dbState: DbState = DbState.INITIAL;
  private stateListeners: DbStateListener[] = [];
  private dbCrypto: DbCrypto = new DbCrypto();
  private dbStorage: DbStorage = new DbStorage();
  private dbData: DbData = new DbData();

  // Resets the database state (crypto, storage, data, state).
  // Does not remove previously installed state listeners.
  reset() {
    this.dbCrypto = new DbCrypto();
    this.dbStorage = new DbStorage();
    this.dbData = new DbData();
    this.setState(DbState.INITIAL);
  }

  getState(): DbState {
    return this.dbState;
  }

  addStateListener(callback: DbStateListener) {
    this.stateListeners.push(callback);
    callback(this.dbState);
  }

  removeStateListener(callback: DbStateListener) {
    this.stateListeners = this.stateListeners.filter(x => x !== callback);
  }

  getModel(): DbModel {
    return this.dbData.getModel();
  }

  getDocument(): DbDocument {
    return this.dbData.getDocument();
  }

  getCryptoParams(): CryptoParams {
    return this.dbData.getCryptoParams();
  }

  isUpgradeSuggested(): boolean {
    return !equalCryptoParams(this.getCryptoParams(), getDefaultCryptoParams());
  }

  // Attempts to download the database. Transitions to the FETCHING state
  // if requested. Returns a promise.
  async download(): Promise<void> {
    console.log('Database.download()');
    this.setState(DbState.FETCHING);
    const doc = await this.dbStorage.download();
    if (!doc) {
      this.setState(DbState.MISSING);
      return;
    }
    await this.assignDocument(doc);
  }

  async upload(): Promise<void> {
    console.log('Database.upload()');
    let iv: ArrayBuffer;
    try {
      const cryptoParams = this.dbData.getCryptoParams();
      iv = this.dbCrypto.makeRandomInitVector(cryptoParams);
    } catch (code) {
      throw {code, message: 'Failed to create init vector'};
    }
    await this.uploadDatabase(iv);
  }

  // Locks the database and transitions to LOCKED. If the database is in
  // any other state than UNLOCKED, this function does nothing.
  async lock(): Promise<void> {
    if (this.dbState !== DbState.UNLOCKED) return;

    console.log('Database.lock()');
    this.dbData.clearModel();
    this.dbCrypto.clearMasterKey();
    this.setState(DbState.LOCKED);
  }

  // Unlocks the database. Transitions to UNLOCKED.
  async unlock(password: string): Promise<void> {
    console.log('Database.unlock()');
    const salt = this.dbData.getPasswordSalt();
    const cryptoParams = this.dbData.getCryptoParams();
    try {
      await this.dbCrypto.setMasterKey(password, salt, cryptoParams);
    } catch (code) {
      throw {code, message: 'Setting master password failed'};
    }
    await this.decryptDatabase();
  }

  // Creates a new database. Transitions to UNLOCKED.
  async create(password: string): Promise<void> {
    console.log('Database.create()');

    // Sanity check. Database must be missing.
    if (this.dbState != DbState.MISSING) {
      throw {code: 'db/invalid-state', message: 'Database must be missing'};
    }

    // Randomize a new password salt and AES init vector.
    const cryptoParams = getDefaultCryptoParams();
    let salt: ArrayBuffer, iv: ArrayBuffer;
    try {
      salt = this.dbCrypto.makeRandomPasswordSalt(cryptoParams);
      iv = this.dbCrypto.makeRandomInitVector(cryptoParams);
    } catch (code) {
      throw {code, message: 'Failed to generate salt or IV'};
    }

    // Generate a new master key.
    try {
      await this.dbCrypto.setMasterKey(password, salt, cryptoParams);
    } catch (code) {
      throw {code, message: 'Setting master password failed'};
    }

    // Create, upload, and decrypt the database.
    await this.createNewDatabase(salt, iv, cryptoParams);
    await this.uploadDatabase(iv);
    await this.decryptDatabase();
  }

  deleteEntry(entry: DbEntry) {
    console.log('Database.deleteEntry()');
    this.dbData.updateEntry(entry, null);
  }

  addEntry(entry: DbEntry) {
    console.log('Database.addEntry()');
    this.dbData.updateEntry(null, entry);
  }

  updateEntry(oldEntry: DbEntry, newEntry: DbEntry) {
    console.log('Database.upateEntry()');
    this.dbData.updateEntry(oldEntry, newEntry);
  }

  async decryptEntry(entry: DbEntry): Promise<DbEntry> {
    const cryptoParams = this.dbData.getCryptoParams();
    return await this.decryptEntryInternal(entry, cryptoParams);
  }

  async encryptEntry(entry: DbEntry): Promise<DbEntry> {
    const cryptoParams = this.dbData.getCryptoParams();
    return await this.encryptEntryInternal(entry, cryptoParams);
  }

  sortEntries() {
    console.log('Database.sortEntries()');
    this.dbData.sortEntries();
  }

  async changePassword(oldPass: string, newPass: string): Promise<void> {
    const newParams = this.dbData.getCryptoParams();
    await this.convertDatabase(oldPass, newPass, newParams);
  }

  async updateCryptoParams(password: string): Promise<void> {
    const newParams = getDefaultCryptoParams();
    await this.convertDatabase(password, password, newParams);
  }

  private async convertDatabase(oldPass: string, newPass: string,
    newParams: CryptoParams): Promise<void> {
    if (!oldPass || !newPass) {
      throw {
        code: 'db/invalid-password',
        message: 'Password is empty'
      } as DatabaseError;
    }
    if (this.getState() === DbState.UNLOCKED) {
      throw {
        code: 'db/invalid-state',
        message: 'Database must be locked',
      } as DatabaseError;
    }
    if (this.getState() !== DbState.LOCKED) {
      throw {
        code: 'db/invalid-state',
        message: 'Database unavailable',
      } as DatabaseError;
    }

    // Decrypt the database (with the CryptoParams in memory).
    await this.unlock(oldPass);

    // Decrypt all entries (also with the CryptoParams in memory).
    const oldModel = this.getModel();
    const decryptedEntries = await Promise.all(
      oldModel.entries.map((entry) => this.decryptEntry(entry))
    );

    // Randomize a new salt and init vector for the database.
    let salt: ArrayBuffer, iv: ArrayBuffer;
    try {
      salt = this.dbCrypto.makeRandomPasswordSalt(newParams);
      iv = this.dbCrypto.makeRandomInitVector(newParams);
    } catch (code) {
      throw {code, message: 'Failed to generate salt or IV'};
    }

    // Generate a new master key and encrypt all entries.
    await this.dbCrypto.setMasterKey(newPass, salt, newParams);
    const encryptedEntries = await Promise.all(
      decryptedEntries.map((entry) => this.encryptEntryInternal(entry, newParams))
    );

    // Create a new database and assign entires.
    this.dbData.createNewDatabase(salt, iv, newParams);
    this.dbData.setModel({...oldModel, entries: encryptedEntries});
  }

  private async assignDocument(doc: DbDocument): Promise<void> {
    console.log('Database.assignDocument()');
    try {
      this.dbData.setDocument(doc);
    } catch (error) {
      throw {code: 'db/unexpected-format', message: (error as Error).message};
    }

    if (this.dbCrypto.hasMasterKey()) {
      await this.decryptDatabase();
    } else {
      this.setState(DbState.LOCKED);
    }
  }

  private async decryptDatabase(): Promise<void> {
    console.log('Database.decryptDatabase()');
    const cryptoParams = this.dbData.getCryptoParams();
    const iv = this.dbData.getAesIv();
    const payload = this.dbData.getPayload();

    try {
      const model = await this.dbCrypto.decrypt(payload, iv, cryptoParams);
      this.dbData.setModel(model as DbModel);
      this.setState(DbState.UNLOCKED);
    } catch (code) {
      await this.lock();
      throw {code, message: 'Decrypting database failed'};
    }
  }

  private async uploadDatabase(iv: ArrayBuffer): Promise<void> {
    console.log('Database.uploadDatabase()');
    const cryptoParams = this.dbData.getCryptoParams();
    const model = this.getModel();
    try {
      const buffer = await this.dbCrypto.encrypt(model, iv, cryptoParams);
      this.dbData.setPayload(buffer, iv);
      const doc = this.dbData.getDocument();
      await this.dbStorage.upload(doc);
    } catch (error: any) {
      if (!!error?.code && !!error?.message) throw error;
      throw {code: error, message: 'Failed to encrypt database'};
    }
  }

  private async createNewDatabase(salt: ArrayBuffer, iv: ArrayBuffer,
    params: CryptoParams): Promise<void> {
    console.log('Database.createNewDatabase()');
    this.dbData.createNewDatabase(salt, iv, params);

    const entries: DbEntry[] = [
      {
        name: 'Amazon',
        icon: 'icons:shopping-cart',
        url: 'https://amazon.com',
        email: 'test@tester.com',
        login: '',
        keywords: 'amazon shopping',
        aesIv: '',
        password: 'pass123',
        notes: '',
      },
      {
        name: 'E-Bay',
        icon: 'icons:shopping-cart',
        url: 'https://ebay.com',
        email: 'test@tester.com',
        login: 'tester',
        keywords: 'shopping',
        aesIv: '',
        password: 'pass321',
        notes: 'Never buy from user bigcheat16 again!',
      },
      {
        name: 'Gmail',
        icon: 'communication:email',
        url: 'https://gmail.com',
        email: 'tester@gmail.com',
        login: '',
        keywords: 'google email',
        aesIv: '',
        password: 'pass213',
        notes: '',
      },
    ];

    const encryptedEntries = await Promise.all(
      entries.map((entry) => this.encryptEntryInternal(entry, params))
    );
    encryptedEntries.forEach((entry) => {
      this.addEntry(entry);
    });
  }

  private setState(state: DbState) {
    if (this.dbState === state) return;
    this.dbState = state;
    this.stateListeners.forEach(cb => cb(this.dbState));
  }

  private async decryptEntryInternal(entry: DbEntry,
    cryptoParams: CryptoParams): Promise<DbEntry> {
    // Load AES init vector and decode password and notes.
    const iv = Base64.decode(entry.aesIv);
    const encryptedPassword = Base64.decode(entry.password);
    const encryptedNotes = Base64.decode(entry.notes);
    // Decrypt password and notes.
    try {
      const [password, notes] = await Promise.all([
        this.dbCrypto.decryptString(encryptedPassword, iv, cryptoParams),
        this.dbCrypto.decryptString(encryptedNotes, iv, cryptoParams),
      ]);
      return {...entry, password, notes};
    } catch (code) {
      throw {code, message: 'Decrypting entry failed'};
    }
  }

  private async encryptEntryInternal(entry: DbEntry,
    cryptoParams: CryptoParams): Promise<DbEntry> {
    // Create new AES init vector and encrypt password and notes.
    try {
      const iv = this.dbCrypto.makeRandomInitVector(cryptoParams);
      const [encryptedPassword, encryptedNotes] = await Promise.all([
        this.dbCrypto.encryptString(entry.password, iv, cryptoParams),
        this.dbCrypto.encryptString(entry.notes, iv, cryptoParams),
      ]);
      return {
        ...entry,
        aesIv: Base64.encode(iv),
        password: Base64.encode(encryptedPassword),
        notes: Base64.encode(encryptedNotes),
      };
    } catch (code) {
      throw {code, message: 'Encrypting entry failed'};
    }
  }
}

// Compares two CryptoParams objects, returns true if equal.
export function equalCryptoParams(a: CryptoParams, b: CryptoParams): boolean {
  return a.deriveAlgo === b.deriveAlgo &&
         a.hashAlgo   === b.hashAlgo &&
         a.cipherMode === b.cipherMode &&
         a.iterations === b.iterations;
}
