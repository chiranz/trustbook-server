const admin = require("firebase-admin");
const { config, credential } = require("../config");

admin.initializeApp({
  databaseURL: config.databaseURL,
  credential: admin.credential.cert(credential),
});

const db = admin.firestore();

module.exports = { admin, db };
