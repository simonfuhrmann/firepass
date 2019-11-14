// A single entry in the database.
// All fields need to be of primitive type because the database is stringified
// using JSON. All binary fields are base64 encoded. Even after the database is
// retrieved and decrypted, sensitive fields remain encrypted until needed.
export interface DbEntry {
  name: string;
  icon: string;
  url: string;
  email: string;
  login: string;
  aesIv: string;  // Base64 encoded AES IV for below fields.
  password: string;  // Encrypted, even in the unencrypted DB.
  notes: string;  // Encrypted, even in the unencrypted DB.
}

// The database that will be fully encrypted.
export interface DbModel {
  entries: DbEntry[];
}

// Database settings that will not be encrypted.
// This contains cryptographic information and may in future contain data
// that is required for the unlock screen, such as a website theme.
export interface DbSettings {
  passSalt: ArrayBuffer;
  aesIv: ArrayBuffer;
}

// Same as DbSettings, but uses primitive types only.
export interface DbSettingsEncoded {
  passSalt: string;  // Base64 encoded.
  aesIv: string;  // Base64 encoded.
}

// The database document uploaded to Firebase.
export interface DbDocument {
  settings: DbSettingsEncoded;
  payload: string;  // Base64 encoded, AES encrypted database.
}
