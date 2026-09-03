const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log("Users:", users.map(u => ({ phone: u.phoneNumber, hasFcm: !!u.fcmToken, fcmToken: u.fcmToken })));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
