export class DbCrypto {
  private masterKey: CryptoKey|null = null;

  // Computes the AES key from the master password and salt. The salt can be
  // stored without encryption, but should be randomized every time a new
  // password is chosen.
  setMasterPassword(password: string, salt: ArrayBuffer) {
    return new Promise((resolve, reject) => {
      if (!password) {
        reject('crypto/empty-password');
        return;
      }
      if (salt.byteLength != 32) {
        reject('crypto/invalid-salt');
        return;
      }
      this.importKey(password)
          .then(baseKey => {
            this.deriveKey(baseKey, salt).then(
                masterKey => {
                  this.masterKey = masterKey;
                  resolve();
                },
                () => reject('crypto/derive-key-failed'));
          },
          () => reject('crypto/import-key-failed'));
    });
  }

  hasMasterPassword(): boolean {
    return !!this.masterKey;
  }

  // Removes the master password from memory.
  // TODO: Overwrite password.
  clear() {
    this.masterKey = null;
  }

  // Encrypts the given object by calling JSON-stringify on it first.
  // The initialization vector `iv` must be 16 bytes.
  encrypt(decrypted: object, iv: ArrayBuffer): Promise<ArrayBuffer> {
    const json = JSON.stringify(decrypted);
    const encoded = new TextEncoder().encode(json);
    return this.encryptRaw(encoded, iv);
  }

  // Decrypts the given binary data and then JSON-parsing it.
  // The initialization vector `iv` must be 16 bytes.
  decrypt(encrypted: ArrayBuffer, iv: ArrayBuffer): Promise<object> {
    return new Promise((resolve, reject) => {
      this.decryptRaw(encrypted, iv)
          .then(decrypted => {
            try {
              const json = new TextDecoder().decode(decrypted);
              const database = JSON.parse(json);
              resolve(database);
            } catch(syntaxError) {
              reject('crypto/wrong-password');
            }
        })
        .catch(() => reject('crypto/wrong-password'));
    });
  }

  private encryptRaw(data: ArrayBuffer, iv: ArrayBuffer): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.masterKey) {
        reject('crypto/no-master-key');
        return;
      }
      if (iv.byteLength != 16) {
        reject('crypto/invalid-iv');
        return;
      }
      const algo = { name: 'AES-CBC', iv: iv };
      crypto.subtle.encrypt(algo, this.masterKey, data).then(
          encrypted => resolve(encrypted),
          error => reject(error));
    });
  }

  private decryptRaw(data: ArrayBuffer, iv: ArrayBuffer): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.masterKey) {
        reject('crypto/no-master-key');
        return;
      }
      if (iv.byteLength != 16) {
        reject('crypto/invalid-iv');
        return;
      }
      const algo = { name: 'AES-CBC', iv: iv };
      crypto.subtle.decrypt(algo, this.masterKey, data).then(
          decrypted => resolve(decrypted),
          error => reject(error));
    });
  }

  private importKey(password: string): PromiseLike<CryptoKey> {
    const format = 'raw';
    const key = new TextEncoder().encode(password);
    const algo = 'PBKDF2';
    const extract = false;
    const usage = ['deriveKey'];
    return crypto.subtle.importKey(format, key, algo, extract, usage);
  }

  private deriveKey(key: CryptoKey, salt: ArrayBuffer): PromiseLike<CryptoKey> {
    const algo = {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 2048,
      salt: salt,
    };
    const type = { name: 'AES-CBC', length: 256, };
    const extract = false;
    const usage = ['encrypt', 'decrypt'];
    return crypto.subtle.deriveKey(algo, key, type, extract, usage);
  }
}
