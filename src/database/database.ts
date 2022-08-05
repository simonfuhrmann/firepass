import {Base64} from '../modules/base64';
import {DbCrypto} from './db-crypto';
import {DbData} from './db-data';
import {DbStorage, DbStorageError} from './db-storage';
import {DbDocument, DbModel, DbEntry} from './db-types';

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

  // Attempts to download the database. Transitions to the FETCHING state
  // if requested. Returns a promise.
  download(setState: boolean): Promise<void> {
    console.log('Database.download()');
    if (setState) {
      this.setState(DbState.FETCHING);
    }

    return new Promise((resolve, reject) => {
      this.dbStorage.download()
          .then(doc => {
            if (!doc) {
              this.setState(DbState.MISSING);
              resolve();
              return;
            }
            this.assignDocument(doc)
                .then(() => resolve())
                .catch(error => reject(error));
          })
          .catch((error: DbStorageError) => reject(error));
    });
  }

  upload(): Promise<void> {
    console.log('Database.upload()');
    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);
    return this.uploadDatabase(iv);
  }

  // Locks the database and transitions to LOCKED. If the database is in
  // any other state than UNLOCKED, this function does nothing.
  lock(): Promise<void> {
    if (this.dbState !== DbState.UNLOCKED) {
      return Promise.resolve();
    }
    console.log('Database.lock()');
    return new Promise((resolve, /*reject*/) => {
      this.dbData.clearModel();
      this.dbCrypto.clear();
      this.setState(DbState.LOCKED);
      resolve();
    });
  }

  // Unlocks the database. Transitions to UNLOCKED.
  unlock(password: string): Promise<void> {
    console.log('Database.unlock()');
    return new Promise((resolve, reject) => {
      const salt = this.dbData.getPasswordSalt();
      this.dbCrypto.setMasterPassword(password, salt)
          .then(() => {
            this.decryptDatabase()
                .then(() => resolve())
                .catch(error => reject(error));
          })
          .catch(code => {
            const message = 'Setting master password failed';
            reject({code, message});
          });
    });
  }

  create(password: string): Promise<void> {
    console.log('Database.create()');
    return new Promise((resolve, reject) => {
      // Randomize a new password salt and AES init vector.
      const salt = new Uint8Array(32);
      const iv = new Uint8Array(16);
      crypto.getRandomValues(salt);
      crypto.getRandomValues(iv);

      // Set master password.
      this.dbCrypto.setMasterPassword(password, salt)
          .then(() => {
            this.createNewDatabase(salt, iv)
                .then(() => this.uploadDatabase(iv))
                .then(() => this.decryptDatabase())
                .then(() => resolve())
                .catch(error => reject(error));
          })
          .catch(code => {
            const message = 'Setting master password failed';
            reject({code, message});
          });
    });
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

  decryptEntry(entry: DbEntry): Promise<DbEntry> {
    return new Promise((resolve, reject) => {
      const iv = Base64.decode(entry.aesIv);
      const encryptedPassword = Base64.decode(entry.password);
      const encryptedNotes = Base64.decode(entry.notes);
      Promise.all([
        this.dbCrypto.decryptString(encryptedPassword, iv),
        this.dbCrypto.decryptString(encryptedNotes, iv),
      ]).then(([password, notes]) => {
        const newEntry = Object.assign({}, entry) as DbEntry;
        newEntry.password = password;
        newEntry.notes = notes;
        resolve(newEntry);
      }).catch(code => {
        const message = 'Decrypting entry failed';
        reject({code, message});
      });
    });
  }

  encryptEntry(entry: DbEntry): Promise<DbEntry> {
    return new Promise((resolve, reject) => {
      const iv = new Uint8Array(16);
      crypto.getRandomValues(iv);
      Promise.all([
        this.dbCrypto.encryptString(entry.password, iv),
        this.dbCrypto.encryptString(entry.notes, iv),
      ]).then(([encryptedPassword, encryptedNotes]) => {
        const newEntry = Object.assign(entry) as DbEntry;
        newEntry.aesIv = Base64.encode(iv);
        newEntry.password = Base64.encode(encryptedPassword);
        newEntry.notes = Base64.encode(encryptedNotes);
        resolve(newEntry);
      }).catch(code => {
        const message = 'Encrypting entry failed';
        reject({code, message});
      });
    });
  }

  sortEntries() {
    console.log('Database.sortEntries()');
    this.dbData.sortEntries();
  }

  async changePassword(oldPass: string, newPass: string): Promise<void> {
    if (!oldPass || !newPass) {
      const error: DatabaseError = {
        code: 'db/invalid-password',
        message: 'Password is empty',
      };
      return Promise.reject(error);
    }
    if (this.getState() === DbState.UNLOCKED) {
      const error: DatabaseError = {
        code: 'db/invalid-state',
        message: 'Database must be locked',
      };
      return Promise.reject(error);
    }
    if (this.getState() !== DbState.LOCKED) {
      const error: DatabaseError = {
        code: 'db/invalid-state',
        message: 'Database unavailable',
      };
      return Promise.reject(error);
    }

    // Decrypt the database.
    await this.unlock(oldPass);
    // Decrypt all entries.
    const oldModel = this.getModel();
    const decryptedEntries = await Promise.all(
        oldModel.entries.map((entry) => this.decryptEntry(entry)));
    // Change master password, randomize a new salt and AES init vector.
    const salt = new Uint8Array(32);
    crypto.getRandomValues(salt);
    await this.dbCrypto.setMasterPassword(newPass, salt);
    // Encrypt all entries.
    const encryptedEntries = await Promise.all(
        decryptedEntries.map((entry) => this.encryptEntry(entry)));
    // Create a new database and assign entires.
    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);
    this.dbData.createNewDatabase(salt, iv);
    this.dbData.setModel({...oldModel, entries: encryptedEntries});
    return Promise.resolve();
  }

  private assignDocument(doc: DbDocument): Promise<void> {
    console.log('Database.assignDocument()');
    return new Promise((resolve, reject) => {
      try {
        this.dbData.setDocument(doc);
      } catch (error) {
        const code = 'db/unexpected-format';
        const message = (error as Error).message;
        reject({code, message});
      }

      if (this.dbCrypto.hasMasterPassword()) {
        this.decryptDatabase();
      } else {
        this.setState(DbState.LOCKED);
      }
      resolve();
    });
  }

  private decryptDatabase(): Promise<void> {
    console.log('Database.decryptDatabase()');
    const iv = this.dbData.getAesIv();
    const payload = this.dbData.getPayload();
    return new Promise((resolve, reject) => {
      this.dbCrypto.decrypt(payload, iv)
          .then(model => {
            this.dbData.setModel(model as DbModel);
            this.setState(DbState.UNLOCKED);
            resolve();
          })
          .catch(code => {
            this.lock();
            const message = 'Decrypting database failed';
            reject({code, message});
          });
    });
  }

  private uploadDatabase(iv: ArrayBuffer): Promise<void> {
    console.log('Database.uploadDatabase()');
    return new Promise((resolve, reject) => {
      const model = this.getModel();
      this.dbCrypto.encrypt(model, iv)
          .then(buffer => {
            this.dbData.setPayload(buffer, iv);
            const doc = this.dbData.getDocument();
            this.dbStorage.upload(doc)
                .then(() => resolve())
                .catch((error: DbStorageError) => reject(error));
          })
          .catch(code => {
            console.log('Error encrypting', code);
            const message = 'Failed to encrypt database';
            reject({code, message});
          });
    });
  }

  private createNewDatabase(salt: ArrayBuffer, iv: ArrayBuffer): Promise<void> {
    console.log('Database.createNewDatabase()');
    this.dbData.createNewDatabase(salt, iv);

    const amazon: DbEntry = {
      name: 'Amazon',
      icon: 'icons:shopping-cart',
      url: 'https://amazon.com',
      email: 'test@tester.com',
      login: '',
      keywords: 'amazon shopping',
      aesIv: '',
      password: 'pass123',
      notes: '',
    };
    const ebay: DbEntry = {
      name: 'E-Bay',
      icon: 'icons:shopping-cart',
      url: 'https://ebay.com',
      email: 'test@tester.com',
      login: 'tester',
      keywords: 'shopping',
      aesIv: '',
      password: 'pass321',
      notes: 'Never buy from user bigcheat16 again!',
    };
    const gmail: DbEntry = {
      name: 'Gmail',
      icon: 'communication:email',
      url: 'https://gmail.com',
      email: 'tester@gmail.com',
      login: '',
      keywords: 'google email',
      aesIv: '',
      password: 'pass213',
      notes: '',
    };

    return Promise.all([
      this.encryptEntry(amazon),
      this.encryptEntry(ebay),
      this.encryptEntry(gmail),
    ]).then(([encAmazon, encEbay, encGmail]) => {
      this.addEntry(encAmazon);
      this.addEntry(encEbay);
      this.addEntry(encGmail);
    });
  }

  private setState(state: DbState) {
    this.dbState = state;
    this.stateListeners.forEach(cb => cb(this.dbState));
  }
}
