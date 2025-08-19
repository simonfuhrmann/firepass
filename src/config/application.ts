// Firepass configuration values.
export const appConfig = {
  // Autmatically lock the database after inactivity.
  idleTimeoutMs: 1000 * 60 * 5,  // 5 Minutes

  // Refetch the database from the server after some idle in the lock screen,
  // when the browser tab gets opened again. This prevents unlocking a stale
  // version of the encrypted database.
  refetchTimeoutMs: 1000 * 60 * 1,  // 1 Minute

  // The version of the application. This is mainly informal.
  appVersion: '1.1.0',

  // The data version the app supports. BEWARE. Only change this if necessary,
  // i.e., if the data format in db-types.ts has to change. To handle data
  // formats with older versions, data version converters in db-data.ts must be
  // implemented.
  dataVersion: 2,  // Integer, incrementing.
};
