import * as Auth from 'firebase/auth';
import * as Store from 'firebase/firestore';

import {firebaseApp} from '../config/firebase';
import {DbDocument} from './db-types';

// Error type for all rejected Promises in this class.
export interface DbStorageError {
  code: string;
  message: string;
}

// Internal storage backend for Firebase.
class DbStorageFirebase {
  private auth = Auth.getAuth(firebaseApp);
  private store = Store.getFirestore(firebaseApp);

  async upload(doc: DbDocument): Promise<void> {
    const docRef = this.getDocRef();
    try {
      await Store.setDoc(docRef, doc);
    } catch (error: any) {
      const code = 'db/' + (error?.code ?? 'unknown');
      const message = error?.message ?? 'Unknown upload error';
      throw {code, message} as DbStorageError;
    }
  }

  async download(): Promise<DbDocument | null> {
    const docRef = this.getDocRef();
    try {
      const docSnap = await Store.getDoc(docRef);
      if (!docSnap.exists) return null;
      return docSnap.data() as DbDocument;
    } catch (error: any) {
      const code = 'db/' + (error?.code ?? 'unknown');
      const message = error?.message ?? 'Unknown download error';
      throw {code, message} as DbStorageError;
    }
  }

  private getDocRef(): Store.DocumentReference {
    const user = this.auth.currentUser;
    if (!user) {
      const code = 'db/missing-auth';
      const message = 'Not authenticated with Firebase';
      throw {code, message} as DbStorageError;
    }
    const userId = user.uid;
    return Store.doc(this.store, 'users/', userId);
  }
}

// Storage API which delegates to the Firebase backend.
export class DbStorage extends DbStorageFirebase {
  // Uploads the database document to the storage provider.
  // Returns a promise that resolves on success, or throws with error.
  upload(doc: DbDocument): Promise<void> {
    return super.upload(doc);
  }

  // Downloads the database document from the storage provider.
  // Returns a promise the resolves with the database on success, or with `null`
  // if the database is not available (new user), or throws with error.
  download(): Promise<DbDocument | null> {
    return super.download();
  }
}
