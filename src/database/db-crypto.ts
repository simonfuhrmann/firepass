export class DbCrypto {
  private masterKey: CryptoKey | null = null;

  // Computes the AES key from the master password and salt. The salt can be
  // stored without encryption, but should be randomized every time a new
  // password is chosen.
  async setMasterPassword(password: string, salt: ArrayBuffer): Promise<void> {
    if (!password) {
      throw 'crypto/empty-password';
    }
    if (salt.byteLength != 32) {
      throw 'crypto/invalid-salt';
    }

    let baseKey: CryptoKey;
    try {
      baseKey = await this.importKey(password);
    } catch {
      throw 'crypto/import-key-failed';
    }

    try {
      this.masterKey = await this.deriveKey(baseKey, salt);
    } catch {
      throw 'crypto/derive-key-failed';
    }
  }

  hasMasterPassword(): boolean {
    return !!this.masterKey;
  }

  // Removes the master password from memory.
  // TODO: Overwrite password.
  clear(): void {
    this.masterKey = null;
  }

  // Encrypts the given object by calling JSON-stringify on it first.
  // The initialization vector `iv` must be 16 bytes.
  async encrypt(decrypted: object, iv: ArrayBuffer): Promise<ArrayBuffer> {
    const json = JSON.stringify(decrypted);
    return this.encryptString(json, iv);
  }

  // Encrypts the given string by encoding it to an ArrayBuffer first. If the
  // string is empty, an ArrayBuffer of size 0 is returned.
  // The initialization vector `iv` must be 16 bytes.
  async encryptString(plain: string, iv: ArrayBuffer): Promise<ArrayBuffer> {
    if (plain === '') return new ArrayBuffer(0);
    const encoded = new TextEncoder().encode(plain);
    return this.encryptRaw(encoded.buffer, iv);
  }

  // Decrypts the given binary data and then JSON-parsing it.
  // The initialization vector `iv` must be 16 bytes.
  async decrypt(encrypted: ArrayBuffer, iv: ArrayBuffer): Promise<object> {
    const decoded = await this.decryptString(encrypted, iv);
    try {
      return JSON.parse(decoded);
    } catch {
      throw 'crypto/wrong-password';
    }
  }

  // Decrypts the given binary data to a string. If the ArrayBuffer is empty,
  // an empty string is returned.
  // The initialization vector `iv` must be 16 bytes.
  async decryptString(encrypted: ArrayBuffer, iv: ArrayBuffer)
    : Promise<string> {
    if (encrypted.byteLength === 0) return '';
    try {
      const decrypted = await this.decryptRaw(encrypted, iv);
      return new TextDecoder().decode(decrypted);
    } catch {
      throw 'crypto/wrong-password';
    }
  }

  // Uses `async` because it throws to yield a rejected promise.
  private async encryptRaw(data: ArrayBuffer, iv: ArrayBuffer)
    : Promise<ArrayBuffer> {
    if (!this.masterKey) throw 'crypto/no-master-key';
    if (iv.byteLength != 16) throw 'crypto/invalid-iv';
    const algo = {name: 'AES-CBC', iv: iv};
    return crypto.subtle.encrypt(algo, this.masterKey, data);
  }

  // Uses `async` because it throws to yield a rejected promise.
  private async decryptRaw(data: ArrayBuffer, iv: ArrayBuffer)
    : Promise<ArrayBuffer> {
    if (!this.masterKey) throw 'crypto/no-master-key';
    if (iv.byteLength != 16) throw 'crypto/invalid-iv';
    const algo = {name: 'AES-CBC', iv: iv};
    return crypto.subtle.decrypt(algo, this.masterKey, data);
  }

  private importKey(password: string): Promise<CryptoKey> {
    const format = 'raw';
    const key = new TextEncoder().encode(password);
    const algo = 'PBKDF2';
    const extract = false;
    const usage: KeyUsage[] = ['deriveKey'];
    return crypto.subtle.importKey(format, key, algo, extract, usage);
  }

  private deriveKey(key: CryptoKey, salt: ArrayBuffer): Promise<CryptoKey> {
    const algo = {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 2048,
      salt: salt,
    };
    const type = {name: 'AES-CBC', length: 256, };
    const extract = false;
    const usage: KeyUsage[] = ['encrypt', 'decrypt'];
    return crypto.subtle.deriveKey(algo, key, type, extract, usage);
  }
}
