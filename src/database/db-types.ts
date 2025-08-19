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
  keywords: string;
  aesIv: string;     // Base64 encoded AES IV for below fields.
  password: string;  // Encrypted, even in the decrypted DB.
  notes: string;     // Encrypted, even in the decrypted DB.
}

// The database that will be fully encrypted.
export interface DbModel {
  entries: DbEntry[];
}

// Cryptographic parameters for key derivation, encryption and decryption.
export interface CryptoParams {
  deriveAlgo: string;  // Default: PBKDF2
  hashAlgo: string;    // Default: SHA-256
  cipherMode: string;  // Default: AES-GCM
  iterations: number;  // Default: 600000
}

// Database settings that will not be encrypted.
// This contains cryptographic information and may in future contain data
// that is required for the unlock screen, such as a website theme.
export interface DbSettings {
  cryptoParams: CryptoParams;
  passSalt: ArrayBuffer;  // 32 bytes for AES-256.
  aesIv: ArrayBuffer;     // 16 bytes for AES-CBC, 12 bytes for AES-GCM.
  dataVersion: number;
}

// Same as DbSettings, but uses primitive types only.
export interface DbSettingsEncoded {
  cryptoParams: CryptoParams;  // May be unset on old DBs.
  passSalt: string;            // Base64 encoded.
  aesIv: string;               // Base64 encoded.
  dataVersion: number;
}

// The database document uploaded to Firebase.
export interface DbDocument {
  settings: DbSettingsEncoded;
  payload: string;  // Base64 encoded, AES encrypted database.
}
