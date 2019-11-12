import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import {DbDocument} from './db-types';

// Error type for all rejected Promises in this class.
export interface DbStorageError {
  code: string;
  message: string;
}

// Internal storage backend for Firebase.
class DbStorageFirebase {
  upload(doc: DbDocument): Promise<void> {
    return new Promise((resolve, reject) => {
      const docRef = this.getDocRef();
      docRef.set(doc)
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
      docRef.get().then(doc => {
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

  private getDocRef() {
    const user = firebase.auth().currentUser;
    if (!user) throw 'Not authenticated with Firebase';
    const userId = user.uid;
    const firestore = firebase.firestore();
    return firestore.collection('users').doc(userId);
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
