# Firepass

Firepass is a password manager. Firepass stores your database in the cloud so
you can access it from anywhere, anytime, from any device with a browser. It
uses [Google Firebase](https://firebase.google.com/) as
[storage](https://firebase.google.com/products/firestore) and
[authentication](https://firebase.google.com/products/auth) backend. In contrast
to popular online password managers you have to create your own Google Firebase
instance and take control of your data. See "Installation" below for details.

Want to play with a demo?

* Visit https://firepass-demo.web.app/
* Login: demo@demo.com (supports local modifications only)
* Login password: demo123
* Database password: demo321

Firepass uses username/password authentication to restrict access to your
database. If your login credentials get compromised, your database is
susceptible to vandalism (deletion, corruption), but all passwords are safely
encrypted using your master password. Unencrypted data never leaves your client,
and all cryptographic operations happen locally. See "Cryptographic Notes" below
for more information.

## Important Notes

* Firepass currently does not support offline access to your database.
* Firepass (intentionally) does not support auto-fill forms on websites.
* Every software has bugs. Make regular backups of your (encrypted) database.

## Cryptographic Notes

Firepass encrypts the database with AES-256 in CBC operation mode. The 128 bit
initialization vector for CBC is randomized every time the database is
encrypted, and stored along with the encrypted database. The symmetric AES key
is derived from your master password using PBKDF2 with 2048 iterations and a
256 bit salt which is randomized whenever the master password is changed. The
salt is stored along with the encrypted database.

All cryptographic operations are implemented locally in the client using the
Web Crypto API (`SubtleCrypto`). Your plain text password is never stored in
JavaScript; it is used immediately to derive the master password using PBKDF2
and then stored in a `CryptoKey` object, which is administered by the browser
implementation.

For storage, the database is encrypted in its entirety into one opaque binary
blob as opposed to individually encrypted entries. No information about the
database contents is revealed in storage or transit. The byte size of the
encrypted database may, however, correlate with the number of entries in the
database. After a certain idle period the local database is locked, your AES key
and all unencrypted data are cleared from the client.

## Installation

* Run `npm install` from the Firepass root to install all dependencies.
* Setup a Google Firebase project (see "Firebase Setup" below for details).
* Enter your Google Firebase config in `src/config/firebase.ts`.
* Optional: Run `npm run start` to run a local development server.
* Optional: Host your Firepass instance on Google Firebase (read below).

## Firebase Setup

Firepass uses Google Firebase as storage and authentication backend. Firepass
supports authentication using the "Email/Password" sign-in method only. Once
signed in, Firepass uses the "Cloud Firestore" database backend to host your
(encrypted) password database.

### Setup your Firebase instance

* Add a new Firebase project using the
  [Firebase Console](https://console.firebase.google.com/).
* Enable the "Email/Password" sign-in method in the "Authentication" menu.
* Add "Email/Password" users in the "Authentication" menu.
* Create a "Cloud Firestore" database in the "Database" menu.
* Add the below security rules to your database.
* Add a web-app in the project settings and obtain the Firebase config.

### Add Database rules

Add the following database security rules under the "Rules" tab in the
"Database" menu, which restricts users to accessing their own data only.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

### Enable Firebase hosting

Google Firebase can also host your Firepass instance (optional).

* Click on "Hosting" in the Google Firebase console.
* Click "Get Started" and follow the instructions (install the Firebase tools)
* Login from the command line (`firebase login`)
* DO NOT run `firebase init`, a `firebase.json` is already provided
* Create a production build (`npm run clean && npm run build`)
* Deploy the build (`firebase deploy`)

Your website is now served from http://PROJECT-ID.web.app. Even though Google
Firebase hosts your website, you can access the website from a domain of your
choice. To do so, select "Add custom domain" from the "Hosting" menu in the
Google Firebase console and follow the instructions.
