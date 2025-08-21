import {appConfig} from '../config/application';
import {Base64} from '../modules/base64';
import {DbModel, DbEntry, DbSettings, DbSettingsEncoded, DbDocument, CryptoParams} from './db-types';

// Returns the default CryptoParams for new databases.
export function getDefaultCryptoParams(): CryptoParams {
  return {
    deriveAlgo: 'PBKDF2',
    hashAlgo: 'SHA-256',
    cipherMode: 'AES-GCM',
    iterations: 600_000,
  };
}

// Returns the legacy CryptoParams before cipher was changed from AES-CBC to
// AES-GCM with the old, low iteration count.
function getLegacyCryptoParams(): CryptoParams {
  return {
    deriveAlgo: 'PBKDF2',
    hashAlgo: 'SHA-256',
    cipherMode: 'AES-CBC',
    iterations: 2048,
  };
}

function encodeDbSettings(settings: DbSettings): DbSettingsEncoded {
  return {
    cryptoParams: settings.cryptoParams,
    passSalt: Base64.encode(settings.passSalt),
    aesIv: Base64.encode(settings.aesIv),
    dataVersion: appConfig.dataVersion,
  };
}

function decodeDbSettings(settingsEnc: DbSettingsEncoded): DbSettings {
  return {
    cryptoParams: settingsEnc.cryptoParams,
    passSalt: Base64.decode(settingsEnc.passSalt),
    aesIv: Base64.decode(settingsEnc.aesIv),
    dataVersion: settingsEnc.dataVersion,
  };
}

function validateDbSettings(settings: DbSettings) {
  if (settings.cryptoParams.deriveAlgo != 'PBKDF2') {
    throw new Error('Only PBKDF2 is supported');
  }
  if (settings.cryptoParams.hashAlgo != 'SHA-256') {
    throw new Error('Only SHA-256 is supported');
  }
  if (settings.cryptoParams.cipherMode != 'AES-CBC' &&
    settings.cryptoParams.cipherMode != 'AES-GCM') {
    throw new Error('Only AES-CBC or AES-GCM is supported');
  }
  if (settings.cryptoParams.iterations < 2048) {
    throw new Error('Key derivation iterations is too low');
  }
}

// The in-memory representation of the database.
export class DbData {
  private payload: ArrayBuffer | null = null;  // The encrypted database.
  private settings: DbSettings | null = null;  // The database settings.
  private model: DbModel | null = null;  // The decrypted database.

  // Returns the decrypted database model. Throws if not set before.
  getModel(): DbModel {
    if (!this.model) throw new Error('Model not initialized');
    return this.model;
  }

  // Sets the decrypted database model, e.g., after unlocking and decrypting.
  setModel(model: DbModel): void {
    this.model = model;
    this.updateDbModel(this.model);
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
    const dbSettingsEnc: DbSettingsEncoded = doc.settings;
    const dbSettings = decodeDbSettings(dbSettingsEnc);
    validateDbSettings(dbSettings);

    this.payload = Base64.decode(doc.payload);
    this.settings = dbSettings;
  }

  // Returns the database document with base64 encoded settings and payload.
  // Required for upload to the storage backend.
  getDocument(): DbDocument {
    if (!this.settings) throw new Error('Settings not initialized');
    if (!this.payload) throw new Error('Payload not initialized');
    const settings: DbSettingsEncoded = encodeDbSettings(this.settings);
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

  // Retuns the CryptoParams for the database.
  getCryptoParams(): CryptoParams {
    if (!this.settings) throw new Error('Settings not initialized');
    return this.settings.cryptoParams;
  }

  // Creates a new, empty database with the given crypto parameters.
  createNewDatabase(salt: ArrayBuffer, iv: ArrayBuffer, params: CryptoParams)
    : void {
    this.settings = {
      cryptoParams: params,
      passSalt: salt,
      aesIv: iv,
      dataVersion: appConfig.dataVersion,
    };
    this.model = {entries: []};
  }

  // Updates a database entry in a group. If the old entry is null, the new
  // entry is created. If the new entry is null, the old entry is deleted.
  // If both entries are null, an exception is thrown.
  // Note: Only encrypted entries must be added.
  updateEntry(oldEntry: DbEntry | null, newEntry: DbEntry | null): void {
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

  // Updates all entries in the model. For example, if new fields are added,
  // they will be undefined. Assign a default.
  private updateDbModel(model: DbModel): void {
    for (const entry of model.entries) {
      if (entry.keywords === undefined) entry.keywords = '';
    }
  }

  private convertDataFormat(doc: DbDocument): DbDocument {
    // Application cannot handle unknown versions.
    if (!doc.settings.dataVersion) {
      throw new Error('Document version unspecified');
    }
    // Application cannot handle more recent versions.
    if (doc.settings.dataVersion > appConfig.dataVersion) {
      const dv = doc.settings.dataVersion;
      throw new Error(`Document version ${dv} unsupported`);
    }

    // Conversion from v1 to v2: If cryptoParams is missing (which it should
    // in all v1 versions), assume the legacy defaults. Then update version.
    if (doc.settings.dataVersion === 1) {
      if (!doc.settings.cryptoParams) {
        doc.settings.cryptoParams = getLegacyCryptoParams();
      }
      doc.settings.dataVersion = 2;
    }

    // Conversion from v2 to v3: Nothing here, app is at v2.

    // Application could not handle older version.
    if (doc.settings.dataVersion < appConfig.dataVersion) {
      throw new Error('No converter for version ' + doc.settings.dataVersion);
    }
    return doc;
  }
}
