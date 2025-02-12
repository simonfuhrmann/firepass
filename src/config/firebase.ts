import * as FirebaseApp from 'firebase/app';

// Your firebase configuration goes here.
//
// Here is how you get your config:
// - Open the Firebase console: https://console.firebase.google.com/
// - Click on the Firebase project for Firepass.
// - Click the settings icon (Project settings) in the sidebar
//
// See here for more information:
// https://support.google.com/firebase/answer/7015592
export const firebaseConfig = {
  apiKey: '',
  databaseURL: '',
  projectId: '',
};

export const firebaseApp = FirebaseApp.initializeApp(firebaseConfig);
