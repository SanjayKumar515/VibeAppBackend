import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Option 1: Use a service account JSON file
// const serviceAccount = require('../../serviceAccountKey.json');

// Option 2: Use environment variables
// Make sure to replace escaped newlines in the private key
const initializeFirebase = () => {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
            console.log('Firebase Admin SDK initialized successfully');
        }
    } catch (error) {
        console.error('Firebase Admin SDK initialization error:', error);
    }
};

export { admin, initializeFirebase };
