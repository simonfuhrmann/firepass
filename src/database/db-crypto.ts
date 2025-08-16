export class DbCrypto {
  private masterKey: CryptoKey | null = null;

  // Computes the AES key from the master password and salt. The salt can be
  // stored without encryption, but should be randomized every time a new
  // password is chosen.
  async setMasterPassword(password: string, salt: ArrayBuffer): Promise<void> {
    if (!password) throw 'crypto/empty-password';
    if (salt.byteLength != 32) throw 'crypto/invalid-salt';

    try {
      this.masterKey = await this.deriveKey(password, salt);
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

  // TODO: Refactor this with more flexible options.
  // - Key algorithm (PBKDF2) should be a parameter
  // - Hash algorithm (SHA-256) should be a parameter
  // - Block cipher mode (AES-CBC) should be a paramter
  // - Iteration could should be a paramter
  // The new default should be PBKDF2, SHA-256, AES-GCM, and 600k iterations.
  // When switching to AES-GCM, the IV must be 12 bytes only.
  private async deriveKey(password: string, salt: ArrayBuffer)
    : Promise<CryptoKey> {
    const keyAlgo = 'PBKDF2';
    const hashAlgo = 'SHA-256';

    // Import the password into a CryptoKey.
    const keyData = new TextEncoder().encode(password);
    const importKeyUsage: KeyUsage[] = ['deriveKey'];
    const baseKey: CryptoKey = await crypto.subtle.importKey(/*format=*/'raw',
      keyData, keyAlgo, /*extractable=*/false, importKeyUsage);

    // Derive the master key from the password with AES.
    const algo = {name: keyAlgo, hash: hashAlgo, iterations: 2048, salt};
    const type = {name: 'AES-CBC', length: 256, };
    const deriveKeyUsage: KeyUsage[] = ['encrypt', 'decrypt'];
    return await crypto.subtle.deriveKey(algo, baseKey, type,
        /*extractable=*/false, deriveKeyUsage);
  }
}
