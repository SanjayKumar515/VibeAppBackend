const admin = require("firebase-admin");
const serviceAccount = require("./config/serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const largeSignal = "x".repeat(5000); // Exceed 4KB

const message = {
  data: {
    type: 'INCOMING_CALL',
    callerId: "test_caller",
    signalData: largeSignal
  },
  token: "dummy_token"
};

admin.messaging().send(message)
  .then(res => console.log("Success:", res))
  .catch(err => console.log("FCM Error Caught:", err.message));
