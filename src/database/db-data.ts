import {DbModel, DbGroup, DbEntry, DbSettings, DbDocument, DbSettingsEncoded} from './db-types';
import {Base64} from './base64';

// The in-memory representation of the database.
export class DbData {
  private payload: ArrayBuffer|null = null;  // The encrypted database.
  private settings: DbSettings|null = null;  // The database settings.
  private model: DbModel|null = null;  // The decrupted database.

  // Returns the database entry groups.
  getModel(): DbModel {
    if (!this.model) throw 'Model not initialized';
    return this.model;
  }

  // Sets the database entry groups, e.g., after decryption.
  setModel(model: DbModel) {
    this.model = model;
  }

  // Sets the document received from the database backend.
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
  getSettings(): DbSettingsEncoded {
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

  // Clears the decrypted data, e.g., on database lock.
  clear() {
    this.model = null;
  }

  // Creates a new, empty database with the given crypto parameters.
  createNewDatabase(salt: ArrayBuffer, iv: ArrayBuffer) {
    this.settings = {
      passSalt: salt,
      aesIv: iv,
    };
    this.model = {groups: []};
  }

  // Adds an empty group for database entries.
  // Throws if the group already exists.
  addGroup(name: string) {
    if (!this.model) throw 'Model not initialized';

    // Check if group already exists.
    const group = this.model.groups.find(group => group.name == name);
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
  }

  // Adds a new database entry to a group.
  // Throws if the group does not exist.
  // Note: Only encrypted entries must be added.
  addEntry(groupName: string, entry: DbEntry) {
    if (!this.model) throw 'Model not initialized';

    const groupIdx = this.model.groups.findIndex(
        group => group.name == groupName);
    if (groupIdx < 0) {
      throw `Group "${groupName}" does not exist`;
    }

    // Copy entries array for the group, add new entry.
    const entries = this.model.groups[groupIdx].entries.slice();
    entries.push(entry);

    // Copy all groups array, update affected group.
    const groups = this.model.groups.slice();
    groups[groupIdx].entries = entries;

    // Update model.
    this.model = {groups};
  }
}
