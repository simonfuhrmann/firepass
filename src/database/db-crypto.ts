import {CryptoParams} from './db-types';

// A container to derive the master key from a password/salt, and to execute
// the symmetric cipher (encrypt, decrypt) with the master key.
//
// - The master key is generated from a user-provided password string, and a
//   password salt. See `setMasterKey()` for more information on the salt.
// - The encrypt/decrypt operations require an initialization vector (IV) that
//   is 16 bytes for AES-CBC, and 12 bytes for AES-GCM. Decryption requires the
//   same IV used for encryption.
//
// Both, the salt and the IV, must be stored in plain text alongside the
// encrypted database.
export class DbCrypto {
  private masterKey: CryptoKey | null = null;

  // Computes the master key (AES key) from the master password and salt.
  // The salt is mixed into the password before the hash/iteration process, to
  // ensure that two users with the same password get different derived keys.
  // The salt is stored without encryption, but must be randomized every time a
  // new password is chosen. The salt is 32 bytes.
  async setMasterKey(password: string, salt: ArrayBuffer, params: CryptoParams)
    : Promise<void> {
    this.validatePassword(password);
    this.validatePasswordSalt(salt, params);
    try {
      this.masterKey = await this.deriveKey(password, salt, params);
    } catch {
      throw 'crypto/derive-key-failed';
    }
  }

  // Returns true if the master key is set.
  hasMasterKey(): boolean {
    return !!this.masterKey;
  }

  // Removes the master password from memory.
  clearMasterKey(): void {
    // TODO: Overwrite password.
    this.masterKey = null;
  }

  // Creates a random IV (16 bytes for AES-CBC, 12 bytes for AES-GCM).
  makeRandomInitVector(params: CryptoParams): ArrayBuffer {
    if (params.cipherMode === 'AES-CBC') {
      return crypto.getRandomValues(new Uint8Array(16)).buffer;
    } else if (params.cipherMode == 'AES-GCM') {
      return crypto.getRandomValues(new Uint8Array(12)).buffer;
    } else {
      throw 'crypto/unsupported-cipher-mode';
    }
  }

  // Creates a random password salt (always 32 bytes).
  makeRandomPasswordSalt(_params: CryptoParams): ArrayBuffer {
    return crypto.getRandomValues(new Uint8Array(32)).buffer;
  }

  // Encrypts the given object by calling JSON-stringify on it first. The
  // initialization vector (IV) is used for encryption (AES-CBC, AES-GCM), and
  // is mixed into the first AES block so that encrypting the same plaintext
  // with the same key does not produce the same ciphertext.
  // The IV must be 16 bytes for AES-CBC, and 12 bytes for AES-GCM.
  async encrypt(decrypted: object, iv: ArrayBuffer, params: CryptoParams)
    : Promise<ArrayBuffer> {
    const json = JSON.stringify(decrypted);
    return this.encryptString(json, iv, params);
  }

  // Encrypts the given string by encoding it to an ArrayBuffer first. If the
  // string is empty, an ArrayBuffer of size 0 is returned. See encrypt().
  async encryptString(plain: string, iv: ArrayBuffer, params: CryptoParams)
    : Promise<ArrayBuffer> {
    if (plain === '') return new ArrayBuffer(0);
    const encoded = new TextEncoder().encode(plain);
    return this.encryptRaw(encoded.buffer, iv, params);
  }

  // Decrypts the given binary data and JSON-parsing it. The initialization
  // vector (IV) is used for decryption, mixed into the first AES block, and
  // must be the same IV used for encryption, to recover the same plain text.
  // The IV must be 16 bytes for AES-CBC, and 12 bytes for AES-GCM.
  async decrypt(encrypted: ArrayBuffer, iv: ArrayBuffer, params: CryptoParams)
    : Promise<object> {
    const decoded = await this.decryptString(encrypted, iv, params);
    try {
      return JSON.parse(decoded);
    } catch {
      throw 'crypto/wrong-password';
    }
  }

  // Decrypts the given binary data to a string. If the ArrayBuffer is empty,
  // an empty string is returned. See decrypt().
  async decryptString(encrypted: ArrayBuffer, iv: ArrayBuffer,
    params: CryptoParams): Promise<string> {
    if (encrypted.byteLength === 0) return '';
    try {
      const decrypted = await this.decryptRaw(encrypted, iv, params);
      return new TextDecoder().decode(decrypted);
    } catch {
      throw 'crypto/wrong-password';
    }
  }

  // Uses `async` because it throws to yield a rejected promise.
  private async encryptRaw(data: ArrayBuffer, iv: ArrayBuffer,
    params: CryptoParams): Promise<ArrayBuffer> {
    if (!this.masterKey) throw 'crypto/no-master-key';
    this.validateInitVector(iv, params);
    const algo = {name: params.cipherMode, iv: iv};
    return crypto.subtle.encrypt(algo, this.masterKey, data);
  }

  // Uses `async` because it throws to yield a rejected promise.
  private async decryptRaw(data: ArrayBuffer, iv: ArrayBuffer,
    params: CryptoParams): Promise<ArrayBuffer> {
    if (!this.masterKey) throw 'crypto/no-master-key';
    this.validateInitVector(iv, params);
    const algo = {name: params.cipherMode, iv: iv};
    return crypto.subtle.decrypt(algo, this.masterKey, data);
  }

  // Derives a new master key from a given password, salt and parameters.
  private async deriveKey(password: string, salt: ArrayBuffer,
    params: CryptoParams): Promise<CryptoKey> {
    // Import the password into a CryptoKey.
    const keyData = new TextEncoder().encode(password);
    const importKeyUsage: KeyUsage[] = ['deriveKey'];
    const baseKey: CryptoKey = await crypto.subtle.importKey(/*format=*/'raw',
      keyData, params.deriveAlgo, /*extractable=*/false, importKeyUsage);

    // Derive the master key from the password with AES.
    const algo: Pbkdf2Params = {
      name: params.deriveAlgo,
      hash: params.hashAlgo,
      iterations: params.iterations,
      salt,
    };
    const type = {name: params.cipherMode, length: 256, };
    const deriveKeyUsage: KeyUsage[] = ['encrypt', 'decrypt'];
    return await crypto.subtle.deriveKey(algo, baseKey, type,
        /*extractable=*/false, deriveKeyUsage);
  }

  private validatePassword(password: string) {
    if (!password) {
      throw 'crypto/empty-password';
    }
  }

  private validateInitVector(iv: ArrayBuffer, params: CryptoParams) {
    if (params.cipherMode === 'AES-CBC') {
      if (iv.byteLength !== 16) throw 'crypto/invalid-iv';
    } else if (params.cipherMode == 'AES-GCM') {
      if (iv.byteLength !== 12) throw 'crypto/invalid-iv';
    } else {
      throw 'crypto/bad-cipher-mode';
    }
  }

  private validatePasswordSalt(salt: ArrayBuffer, _params: CryptoParams) {
    if (salt.byteLength !== 32) {
      throw 'crypto/invalid-salt';
    }
  }
}
