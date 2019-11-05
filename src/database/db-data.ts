import {DbModel, DbGroup, DbEntry, DbSettings, DbDocument, DbSettingsEncoded} from './db-types';
import {Base64} from './base64';

// The in-memory representation of the database.
export class DbData {
  private payload: ArrayBuffer|null = null;  // The encrypted database.
  private settings: DbSettings|null = null;  // The database settings.
  private model: DbModel|null = null;  // The decrupted database.

  // Returns the decrypted database model. Throws if not set before.
  getModel(): DbModel {
    if (!this.model) throw 'Model not initialized';
    return this.model;
  }

  // Sets the decrypted database model, e.g., after unlocking and decrypting.
  setModel(model: DbModel) {
    this.model = model;
  }

  // Clears all decrypted data, e.g., on database lock.
  clearModel() {
    this.model = null;
  }

  // Sets the document stored in the database backend, e.g., after downloading
  // it from the backend, or after uploading a new version to the backend.
  setDocument(doc: DbDocument) {
    if (!doc.settings || !doc.payload) {
      throw 'db/unexpected-format';
    }
    this.payload = Base64.decode(doc.payload);
    this.settings = {
      passSalt: Base64.decode(doc.settings.passSalt),
      aesIv: Base64.decode(doc.settings.aesIv),
    };
  }

  // Returns the (base64 encoded) database settings.
  getEncodedSettings(): DbSettingsEncoded {
    if (!this.settings) throw 'Settings not initialized';
    return {
      passSalt: Base64.encode(this.settings.passSalt),
      aesIv: Base64.encode(this.settings.aesIv),
    };
  }

  // Returns the salt for deriving the master key from the master password.
  getPasswordSalt(): ArrayBuffer {
    if (!this.settings) throw 'Settings not initialized';
    return this.settings.passSalt;
  }

  // Returns the AES initialization vector for encryption/decyption.
  getAesIv(): ArrayBuffer {
    if (!this.settings) throw 'Settings not initialized';
    return this.settings.aesIv;
  }

  // Returns the database payload (the encrypted database).
  getPayload(): ArrayBuffer {
    if (!this.payload) throw 'Payload not initialzed';
    return this.payload;
  };

  // Creates a new, empty database with the given crypto parameters.
  createNewDatabase(salt: ArrayBuffer, iv: ArrayBuffer) {
    this.settings = {
      passSalt: salt,
      aesIv: iv,
    };
    this.model = {groups: []};
  }

  // Adds an empty group for entries, and returns it.
  // Throws if the model is not set, or the group already exists.
  addGroup(name: string): DbGroup {
    if (!this.model) throw 'Model not initialized';

    // Check if group already exists.
    const group = this.model.groups.find(group => group.name === name);
    if (!!group) {
      throw `Group "${name}" already exists`;
    }

    // Create new group.
    const newGroup: DbGroup = {
      name: name,
      entries: [],
    };

    // Update model.
    this.model = {
      groups: [...this.model.groups, newGroup],
    };

    return newGroup;
  }

  // Deletes an existing group including all entries.
  deleteGroup(group: DbGroup) {
    if (!this.model) throw 'Model not initialized';
    const groups = this.model.groups.filter(g => g !== group);
    this.model = {groups};
  }

  // Updates a database entry in a group. If the old entry is null, the new
  // entry is created. If the new entry is null, the old entry is deleted.
  // If both entries are null, an exception is thrown.
  // Note: Only encrypted entries must be added.
  updateEntry(group: DbGroup, oldEntry: DbEntry|null, newEntry: DbEntry|null) {
    if (!this.model) throw 'Model not initialized';
    if (!oldEntry && !newEntry) throw 'Both old and new entry are null';

    const groupIdx = this.model.groups.findIndex(elem => elem === group);
    if (groupIdx < 0) throw `Group "${group.name}" does not exist`;
    const groupEntries = this.model.groups[groupIdx].entries;

    // If the new entry is null, delete the old entry. If the old entry is null,
    // add a new entry. Otherwise update the existing entry.
    let entries = groupEntries.slice();
    if (!oldEntry) {
      if (!newEntry) return;  // Just to prevent TS warnings.
      entries.push(newEntry);
    } else {
      const entryIdx = groupEntries.findIndex(elem => elem === oldEntry);
      if (!newEntry) {
        entries.splice(entryIdx, 1);
      } else {
        entries.splice(entryIdx, 1, newEntry);
      }
    }

    // Copy all groups array, update affected group.
    const groups = this.model.groups.slice();
    groups[groupIdx].entries = entries;

    // Update model.
    this.model = {groups};
  }

  sortGroupsAndEntries() {
    if (!this.model) throw 'Model not initialized';
    this.model.groups.sort((a, b) => a.name.localeCompare(b.name));
    this.model.groups.forEach(group => {
      group.entries.sort((a, b) => a.name.localeCompare(b.name));
    });
  }
}
