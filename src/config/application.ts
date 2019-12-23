// Firepass configuration values.
export const appConfig = {
  // Autmatically lock the database after inactivity.
  idleTimeoutMs: 1000 * 60 * 5,  // 5 Minutes

  // The version of the application. This is mainly informal.
  appVersion: '1.0.0',

  // The data version the app supports. BEWARE. Only change this if necessary,
  // i.e., if the data format in db-types.ts has to change. To handle data
  // formats with older versions, data version converters in db-data.ts must be
  // implemented.
  dataVersion: 1,  // Integer, incrementing.
};
