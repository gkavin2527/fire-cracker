
// src/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const SERVICE_ACCOUNT_PATH_ENV = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH;
const SERVICE_ACCOUNT_JSON_ENV = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let adminApp: admin.app.App;

if (!admin.apps.length) {
  try {
    let serviceAccount;

    if (SERVICE_ACCOUNT_JSON_ENV) {
      console.log("[FirebaseAdmin] Initializing with FIREBASE_SERVICE_ACCOUNT_JSON env variable.");
      serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON_ENV);
    } else if (SERVICE_ACCOUNT_PATH_ENV) {
      console.log(`[FirebaseAdmin] Initializing with FIREBASE_SERVICE_ACCOUNT_JSON_PATH: ${SERVICE_ACCOUNT_PATH_ENV}`);
      const serviceAccountKeyPath = path.resolve(SERVICE_ACCOUNT_PATH_ENV);
      if (fs.existsSync(serviceAccountKeyPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));
      } else {
        console.error(`[FirebaseAdmin] Service account key file not found at path: ${serviceAccountKeyPath}. Path env var: ${SERVICE_ACCOUNT_PATH_ENV}`);
        throw new Error(`Service account key file not found at ${serviceAccountKeyPath}. Ensure FIREBASE_SERVICE_ACCOUNT_JSON_PATH is correct or use FIREBASE_SERVICE_ACCOUNT_JSON.`);
      }
    } else {
      console.warn(
        "[FirebaseAdmin] Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_JSON_PATH environment variables are set. " +
        "Firebase Admin SDK will try to initialize with default credentials if available (e.g., in Google Cloud environment), " +
        "but this might not work for local development or all use cases. API routes requiring admin privileges might fail."
      );
    }

    if (serviceAccount) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Optionally, specify your databaseURL if needed, though often not necessary with cert credentials
        // databaseURL: `https://<YOUR_PROJECT_ID>.firebaseio.com`
      });
    } else {
      // Attempt default initialization (e.g., for Google Cloud Functions, App Engine)
      // This relies on GOOGLE_APPLICATION_CREDENTIALS env var being set by the environment
      adminApp = admin.initializeApp();
      console.log("[FirebaseAdmin] Initialized with default credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS).");
    }
    console.log("[FirebaseAdmin] Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error('[FirebaseAdmin] Firebase Admin SDK initialization error:', error.stack);
    // To prevent app from crashing if admin SDK fails, we can assign a dummy or handle it.
    // For now, we'll let it potentially fail if credentials are truly missing and required.
    // If you have parts of your app that don't need admin, you might need more sophisticated error handling.
    // For API routes that *depend* on admin, they will fail if this init fails.
  }
} else {
  adminApp = admin.apps[0]!;
  // console.log("[FirebaseAdmin] Firebase Admin SDK already initialized.");
}

export { adminApp };
export const adminAuth = adminApp ? admin.auth(adminApp) : null;
export const adminDb = adminApp ? admin.firestore(adminApp) : null;
