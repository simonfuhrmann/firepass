import {Base64} from './base64';
import {DbCrypto} from './db-crypto';
import {DbData} from './db-data';
import {DbStorage} from './db-storage';
import {DbDocument, DbModel, DbGroup, DbEntry} from './db-types';

export enum DbState {
  INITIAL,  // Initial state before fetching for the first time.
  FETCHING,  // The database is currently being fetched.
  MISSING,  // No database created yet on the storage backend.
  LOCKED,  // The database was downloaded and is in locked (encrypted) state.
  UNLOCKED,  // The database was downloaded and unlocked (decrypted).
}

// Error type for all rejected Promises in this class.
export interface DatabaseError {
  code: string,
  message: string,
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

  getModel(): DbModel {
    return this.dbData.getModel();
  }

  getState(): DbState {
    return this.dbState;
  }

  addStateListener(callback: DbStateListener) {
    this.stateListeners.push(callback);
    callback(this.dbState);
  }

  removeStateListener(callback: DbStateListener) {
    this.stateListeners = this.stateListeners.filter(x => x != callback);
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
            if (doc == null) {
              this.setState(DbState.MISSING);
              resolve();
              return;
            }
            this.assignDocument(doc)
                .then(() => resolve())
                .catch(error => reject(error));
          })
          .catch(error => {
            const code = 'db/' + error.code;
            const message = 'Invalid Firebase config or data setup';
            reject({code, message});
          });
    });
  }

  // Locks the database and transitions to LOCKED.
  // TODO: Encrypt the database and save if there are changes.
  // TODO: Overwrite memory?
  lock(): Promise<void> {
    return new Promise((resolve, /*reject*/) => {
      console.log('Database.lock()');
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
            this.createNewDatabase(salt, iv);
            this.uploadDatabase(iv)
                .then(() => {
                  this.decryptDatabase()
                      .then(() => resolve())
                      .catch(error => reject(error));
                })
                .catch(error => reject(error));
          })
          .catch(code => {
            const message = 'Setting master password failed';
            reject({code, message});
          });
    });
  }

  deleteEntry(group: DbGroup, entry: DbEntry) {
    this.dbData.updateEntry(group, entry, null);
  }

  addEntry(group: DbGroup, entry: DbEntry) {
    this.dbData.updateEntry(group, null, entry);
  }

  updateEntry(group: DbGroup, oldEntry: DbEntry, newEntry: DbEntry) {
    this.dbData.updateEntry(group, oldEntry, newEntry);
  }

  private assignDocument(doc: DbDocument): Promise<void> {
    console.log('Database.assignDocument()');
    return new Promise((resolve, reject) => {
      try {
        this.dbData.setDocument(doc);
      } catch (error) {
        const code = 'db/unexpected-format';
        const message = 'Unexpected database format';
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
            console.log('decrypted model', model);
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
      const model = this.dbData.getModel();
      const settings = this.dbData.getEncodedSettings();
      this.dbCrypto.encrypt(model, iv)
          .then(buffer => {
            const payload = Base64.encode(buffer);
            const doc: DbDocument = {settings, payload};
            this.dbData.setDocument(doc);
            this.dbStorage.upload(doc)
                .then(() => resolve())
                .catch(code => {
                  console.log('Error uploading', code);
                  const message = 'Failed to upload database';
                  reject({code, message});
                });
          })
          .catch(code => {
            console.log('Error encrypting', code);
            const message = 'Failed to encrypt database';
            reject({code, message});
          });
    });
  }

  private createNewDatabase(salt: ArrayBuffer, iv: ArrayBuffer) {
    console.log('Database.createNewDatabase()');
    this.dbData.createNewDatabase(salt, iv);

    const amazon: DbEntry = {
      name: 'Amazon',
      icon: 'icons:shopping-cart',
      url: 'https://amazon.com',
      email: 'test@tester.com',
      login: '', aesIv: '', password: '', notes: '',
    };
    const ebay: DbEntry = {
      name: 'E-Bay',
      icon: 'icons:shopping-cart',
      url: 'https://ebay.com',
      email: 'test@tester.com',
      login: 'tester',
      aesIv: '', password: '', notes: '',
    };
    const gmail: DbEntry = {
      name: 'Gmail',
      icon: 'communication:email',
      url: 'https://gmail.com',
      email: 'tester@gmail.com',
      login: '', aesIv: '', password: '', notes: '',
    };

    let group = this.dbData.addGroup('Shopping');
    this.addEntry(group, amazon);
    this.addEntry(group, ebay);
    group = this.dbData.addGroup('Email');
    this.addEntry(group, gmail);
  }

  private setState(state: DbState) {
    this.dbState = state;
    this.stateListeners.forEach(cb => cb(this.dbState));
  }
}
