import {DbModel, DbEntry, DbSettings, DbDocument} from './db-types';
import {Base64} from '../modules/base64';

// The in-memory representation of the database.
export class DbData {
  private readonly dataVersion: number = 1;
  private payload: ArrayBuffer|null = null;  // The encrypted database.
  private settings: DbSettings|null = null;  // The database settings.
  private model: DbModel|null = null;  // The decrypted database.

  // Returns the decrypted database model. Throws if not set before.
  getModel(): DbModel {
    if (!this.model) throw new Error('Model not initialized');
    return this.model;
  }

  // Sets the decrypted database model, e.g., after unlocking and decrypting.
  setModel(model: DbModel): void {
    this.model = model;
  }

  // Clears all decrypted data, e.g., on database lock.
  clearModel(): void {
    this.model = null;
  }

  // Sets the document stored in the database backend. Required after
  // downloading it from the storage backend.
  setDocument(doc: DbDocument): void {
    if (!doc.settings || !doc.payload) {
      throw new Error('Document format not recognized');
    }
    doc = this.convertDataFormat(doc);
    this.payload = Base64.decode(doc.payload);
    this.settings = {
      passSalt: Base64.decode(doc.settings.passSalt),
      aesIv: Base64.decode(doc.settings.aesIv),
      dataVersion: doc.settings.dataVersion,
    };
  }

  // Returns the database document with base64 encoded settings and payload.
  // Required for upload to the storage backend.
  getDocument(): DbDocument {
    if (!this.settings) throw new Error('Settings not initialized');
    if (!this.payload) throw new Error('Payload not initialized');
    const settings = {
      passSalt: Base64.encode(this.settings.passSalt),
      aesIv: Base64.encode(this.settings.aesIv),
      dataVersion: this.dataVersion,
    };
    const payload = Base64.encode(this.payload);
    return {settings, payload};
  }

  // Sets a new payload (the encrypted database). Required after the database
  // has locally changed.
  setPayload(payload: ArrayBuffer, aesIv: ArrayBuffer): void {
    if (!this.settings) throw new Error('Settings not initialized');
    this.payload = payload;
    this.settings.aesIv = aesIv;
  }

  // Returns the database payload (the encrypted database).
  getPayload(): ArrayBuffer {
    if (!this.payload) throw new Error('Payload not initialzed');
    return this.payload;
  };

  // Returns the salt for deriving the master key from the master password.
  getPasswordSalt(): ArrayBuffer {
    if (!this.settings) throw new Error('Settings not initialized');
    return this.settings.passSalt;
  }

  // Returns the AES initialization vector for encryption/decyption.
  getAesIv(): ArrayBuffer {
    if (!this.settings) throw new Error('Settings not initialized');
    return this.settings.aesIv;
  }

  // Creates a new, empty database with the given crypto parameters.
  createNewDatabase(salt: ArrayBuffer, iv: ArrayBuffer): void {
    this.settings = {
      passSalt: salt,
      aesIv: iv,
      dataVersion: this.dataVersion,
    };
    this.model = {entries: []};
  }

  // Updates a database entry in a group. If the old entry is null, the new
  // entry is created. If the new entry is null, the old entry is deleted.
  // If both entries are null, an exception is thrown.
  // Note: Only encrypted entries must be added.
  updateEntry(oldEntry: DbEntry|null, newEntry: DbEntry|null): void {
    if (!this.model) throw new Error('Model not initialized');
    if (!oldEntry && !newEntry) throw new Error('Both entries are null');

    // If the new entry is null, delete the old entry. If the old entry is null,
    // add a new entry. Otherwise update the existing entry.
    let entries = this.model.entries.slice();
    if (!oldEntry) {
      if (!newEntry) return;  // Just to prevent TS warnings.
      entries.push(newEntry);
    } else {
      const entryIdx = entries.findIndex(elem => elem === oldEntry);
      if (entryIdx < 0) throw new Error('Old entry not in database');
      if (!newEntry) {
        entries.splice(entryIdx, 1);
      } else {
        entries.splice(entryIdx, 1, newEntry);
      }
    }

    // Update model.
    this.model = {entries};
  }

  sortEntries(): void {
    if (!this.model) throw new Error('Model not initialized');
    this.model.entries.sort((a, b) => a.name.localeCompare(b.name));
  }

  private convertDataFormat(doc: DbDocument): DbDocument {
    // Application can not handle unknown versions.
    if (!doc.settings.dataVersion) {
      throw new Error('Document version unspecified');
    }
    // Application can not handle newer versions.
    if (doc.settings.dataVersion > this.dataVersion) {
      throw new Error('Document version unsupported');
    }
    return doc;
  }
}
