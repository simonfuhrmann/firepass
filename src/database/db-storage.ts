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

  upload(doc: DbDocument): Promise<void> {
    return new Promise((resolve, reject) => {
      const docRef = this.getDocRef();
      Store.setDoc(docRef, doc)
          .then(() => resolve())
          .catch(error => {
            const code = 'db/' + error.code;
            const message = error.message;
            reject({code, message});
          });
    });
  }

  download(): Promise<DbDocument|null> {
    return new Promise((resolve, reject) => {
      const docRef = this.getDocRef();
      Store.getDoc(docRef)
          .then(doc => {
            if (!doc.exists) resolve(null);
            resolve(doc.data() as DbDocument);
          })
          .catch(error => {
            const code = 'db/' + error.code;
            const message = error.message;
            reject({code, message});
          });
    });
  }

  private getDocRef(): Store.DocumentReference {
    const user = this.auth.currentUser;
    if (!user) throw 'Not authenticated with Firebase';
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
  download(): Promise<DbDocument|null> {
    return super.download();
  }
}
