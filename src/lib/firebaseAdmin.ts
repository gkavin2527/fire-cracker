
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
  console.log("[FirebaseAdmin] Attempting to initialize Firebase Admin SDK...");
  try {
    let serviceAccount;
    let initMethod = "default credentials";

    if (SERVICE_ACCOUNT_JSON_ENV) {
      console.log("[FirebaseAdmin] Using FIREBASE_SERVICE_ACCOUNT_JSON (direct JSON string) for initialization.");
      try {
        serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON_ENV);
        initMethod = "FIREBASE_SERVICE_ACCOUNT_JSON environment variable";
      } catch (e: any) {
        console.error("[FirebaseAdmin] CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Error:", e.message);
        throw new Error(`Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON: ${e.message}`);
      }
    } else if (SERVICE_ACCOUNT_PATH_ENV) {
      const projectRoot = process.cwd(); // Get current working directory (project root)
      const serviceAccountKeyPath = path.resolve(projectRoot, SERVICE_ACCOUNT_PATH_ENV);
      console.log(`[FirebaseAdmin] Using FIREBASE_SERVICE_ACCOUNT_JSON_PATH. Env value: '${SERVICE_ACCOUNT_PATH_ENV}'. Resolved path: '${serviceAccountKeyPath}'`);
      
      if (fs.existsSync(serviceAccountKeyPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));
          initMethod = `file at ${serviceAccountKeyPath}`;
        } catch (e: any) {
          console.error(`[FirebaseAdmin] CRITICAL: Failed to read or parse service account key file at ${serviceAccountKeyPath}. Error:`, e.message);
          throw new Error(`Could not read/parse service account key file from ${serviceAccountKeyPath}: ${e.message}`);
        }
      } else {
        console.error(`[FirebaseAdmin] CRITICAL: Service account key file NOT FOUND at resolved path: '${serviceAccountKeyPath}'. (Original path in env var FIREBASE_SERVICE_ACCOUNT_JSON_PATH: '${SERVICE_ACCOUNT_PATH_ENV}')`);
        console.error(`[FirebaseAdmin] Ensure the path is relative to the project root (e.g., './firebase-service-account.json') or an absolute path, and the file exists.`);
        throw new Error(`Service account key file not found at ${serviceAccountKeyPath}. Check FIREBASE_SERVICE_ACCOUNT_JSON_PATH or use FIREBASE_SERVICE_ACCOUNT_JSON.`);
      }
    } else {
      console.warn(
        "[FirebaseAdmin] WARNING: Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_JSON_PATH environment variables are set. " +
        "Firebase Admin SDK will attempt to initialize with default Google Application Credentials if available (e.g., in a Google Cloud environment). " +
        "This might not work for local development if GOOGLE_APPLICATION_CREDENTIALS env var is not set. API routes requiring admin privileges may fail."
      );
      // No serviceAccount, admin.initializeApp() will use default ADC
    }

    if (serviceAccount) {
      adminAppInstance = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Attempt default initialization (e.g., for Google Cloud Functions, App Engine)
      adminAppInstance = admin.initializeApp();
    }
    
    if(adminAppInstance) {
        adminAuthInstance = admin.auth(adminAppInstance);
        adminDbInstance = admin.firestore(adminAppInstance);
        console.log(`[FirebaseAdmin] Firebase Admin SDK initialized successfully using ${initMethod}. Auth and Firestore instances are ready.`);
    } else {
        // This case should ideally not be reached if initializeApp throws on critical failure.
        console.error("[FirebaseAdmin] CRITICAL: admin.initializeApp() did not return a valid app instance AND may not have thrown an error. Admin SDK components will be unavailable.");
        // Explicitly ensure they are null if app instance is not valid
        adminAuthInstance = null;
        adminDbInstance = null;
    }

  } catch (error: any) {
    console.error('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('[FirebaseAdmin] !!!! CRITICAL: Firebase Admin SDK INITIALIZATION FAILED !!!!');
    console.error('[FirebaseAdmin] Error Message:', error.message);
    console.error('[FirebaseAdmin] Error Stack (useful for diagnosing the exact point of failure):', error.stack);
    console.error('[FirebaseAdmin] Common Causes & Checks:');
    console.error('[FirebaseAdmin]   1. Missing or incorrect `FIREBASE_SERVICE_ACCOUNT_JSON_PATH` in .env.local (should point to your key file, e.g., `./service-account.json`).');
    console.error('[FirebaseAdmin]   2. Missing or malformed `FIREBASE_SERVICE_ACCOUNT_JSON` env var (if using direct JSON string).');
    console.error('[FirebaseAdmin]   3. The service account JSON file itself is corrupted, not valid JSON, or does not exist at the specified path.');
    console.error('[FirebaseAdmin]   4. If relying on default credentials (no specific env var set), ensure `GOOGLE_APPLICATION_CREDENTIALS` is set in your environment, or you are running in a Google Cloud environment that provides them.');
    console.error('[FirebaseAdmin]   5. Ensure you RESTARTED your Next.js server after any changes to .env.local or service account files.');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n');
    // adminAppInstance, adminAuthInstance, adminDbInstance will remain null due to the initial declaration
  }
} else {
  adminAppInstance = admin.apps[0]!; // Non-null assertion, as we know admin.apps.length > 0
  if (adminAppInstance) {
    adminAuthInstance = admin.auth(adminAppInstance);
    adminDbInstance = admin.firestore(adminAppInstance);
    // console.log("[FirebaseAdmin] Firebase Admin SDK was already initialized. Reusing existing instances for Auth and Firestore.");
  } else {
    // This should be an extremely rare case, indicating a problem with how Firebase SDK manages admin.apps
    console.error("[FirebaseAdmin] CRITICAL: Existing admin.app instance (admin.apps[0]) was found but is null/undefined. Admin SDK components will be unavailable.");
    adminAuthInstance = null;
    adminDbInstance = null;
  }
}

// Export the potentially null instances. The API route MUST check these before use.
export const adminApp = adminAppInstance;
export const adminAuth = adminAuthInstance;
export const adminDb = adminDbInstance;
