
// src/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const SERVICE_ACCOUNT_PATH_ENV = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH;
const SERVICE_ACCOUNT_JSON_ENV = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let adminAppInstance: admin.app.App | null = null;
let adminAuthInstance: admin.auth.Auth | null = null;
let adminDbInstance: admin.firestore.Firestore | null = null;

if (admin.apps.length === 0) {
  try {
    let serviceAccount;

    if (SERVICE_ACCOUNT_JSON_ENV) {
      console.log("[FirebaseAdmin] Attempting to initialize with FIREBASE_SERVICE_ACCOUNT_JSON env variable.");
      serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON_ENV);
    } else if (SERVICE_ACCOUNT_PATH_ENV) {
      console.log(`[FirebaseAdmin] Attempting to initialize with FIREBASE_SERVICE_ACCOUNT_JSON_PATH: ${SERVICE_ACCOUNT_PATH_ENV}`);
      const serviceAccountKeyPath = path.resolve(SERVICE_ACCOUNT_PATH_ENV);
      if (fs.existsSync(serviceAccountKeyPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));
      } else {
        console.error(`[FirebaseAdmin] CRITICAL: Service account key file NOT FOUND at resolved path: ${serviceAccountKeyPath}. (Original path in env var: ${SERVICE_ACCOUNT_PATH_ENV})`);
        throw new Error(`Service account key file not found at ${serviceAccountKeyPath}. Ensure FIREBASE_SERVICE_ACCOUNT_JSON_PATH is correct and points to a file in the project root, or use FIREBASE_SERVICE_ACCOUNT_JSON.`);
      }
    } else {
      console.warn(
        "[FirebaseAdmin] WARNING: Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_JSON_PATH environment variables are set. " +
        "Firebase Admin SDK will attempt to initialize with default credentials if available (e.g., in a Google Cloud environment). " +
        "This might not work for local development. API routes requiring admin privileges may fail."
      );
    }

    if (serviceAccount) {
      adminAppInstance = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Attempt default initialization (e.g., for Google Cloud Functions, App Engine)
      // This relies on GOOGLE_APPLICATION_CREDENTIALS env var being set by the environment
      adminAppInstance = admin.initializeApp();
      console.log("[FirebaseAdmin] Initialized with default credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS).");
    }
    
    if(adminAppInstance) {
        adminAuthInstance = admin.auth(adminAppInstance);
        adminDbInstance = admin.firestore(adminAppInstance);
        console.log("[FirebaseAdmin] Firebase Admin SDK initialized successfully and instances for Auth and Firestore have been created.");
    } else {
        // This case should ideally not be reached if initializeApp throws on critical failure.
        console.error("[FirebaseAdmin] CRITICAL: admin.initializeApp() did not return a valid app instance and may not have thrown an error. SDK components will be unavailable.");
    }

  } catch (error: any) {
    console.error('[FirebaseAdmin] CRITICAL: Firebase Admin SDK initialization error:', error.message);
    console.error('[FirebaseAdmin] Full error stack:', error.stack);
    // adminAppInstance, adminAuthInstance, adminDbInstance will remain null
  }
} else {
  adminAppInstance = admin.apps[0]!;
  if (adminAppInstance) {
    adminAuthInstance = admin.auth(adminAppInstance);
    adminDbInstance = admin.firestore(adminAppInstance);
    // console.log("[FirebaseAdmin] Firebase Admin SDK already initialized and instances retrieved.");
  } else {
    console.error("[FirebaseAdmin] CRITICAL: Existing admin.app instance was found but is null/undefined. SDK components will be unavailable.");
  }
}

// Export the potentially null instances
export const adminApp = adminAppInstance;
export const adminAuth = adminAuthInstance;
export const adminDb = adminDbInstance;

