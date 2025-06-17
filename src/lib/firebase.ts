import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

interface FirebaseConfigValues {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const firebaseConfigValues: FirebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const expectedKeys: (keyof FirebaseConfigValues)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

let allKeysPresent = true;
const missingKeys: string[] = [];
const envVarExamples: string[] = [];
const actualEnvVars: Record<string, string | undefined> = {};

// Determine the console output function based on environment
// Use console.error for high visibility of critical issues, especially during build/server-side.
let consoleOutputFunction = console.error;
if (typeof window !== 'undefined') {
  // For client-side, console.log might be less alarming if it's a common re-import,
  // but given the severity of this config issue, console.error is still appropriate.
  // We'll use a flag to ensure client-side warning logs only once per session effectively.
  if (!(window as any).__FIREBASE_CONFIG_WARNING_LOGGED__) {
    (window as any).__FIREBASE_CONFIG_WARNING_LOGGED__ = true;
  } else {
    // If already logged on client, suppress further identical warnings during HMR, etc.
    // Set to a no-op function.
    consoleOutputFunction = () => {};
  }
}


expectedKeys.forEach(keyName => {
  let envVarName = `NEXT_PUBLIC_FIREBASE_`;
  let exampleValuePart = `your_actual_`;
  switch (keyName) {
    case 'apiKey': envVarName += 'API_KEY'; exampleValuePart += 'api_key'; break;
    case 'authDomain': envVarName += 'AUTH_DOMAIN'; exampleValuePart += 'auth_domain'; break;
    case 'projectId': envVarName += 'PROJECT_ID'; exampleValuePart += 'project_id'; break;
    case 'storageBucket': envVarName += 'STORAGE_BUCKET'; exampleValuePart += 'storage_bucket'; break;
    case 'messagingSenderId': envVarName += 'MESSAGING_SENDER_ID'; exampleValuePart += 'messaging_sender_id'; break;
    case 'appId': envVarName += 'APP_ID'; exampleValuePart += 'app_id'; break;
  }
  envVarExamples.push(`${envVarName}=${exampleValuePart}_from_firebase_console`);
  actualEnvVars[envVarName] = process.env[envVarName]; // Store actual value for logging

  if (!firebaseConfigValues[keyName]) {
    allKeysPresent = false;
    missingKeys.push(envVarName);
  }
});

if (!allKeysPresent) {
  const warningMessage =
    `\n\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n` +
    `CRITICAL FIREBASE CONFIGURATION WARNING (src/lib/firebase.ts):\n` +
    `One or more Firebase environment variables are MISSING or UNDEFINED.\n` +
    `Firebase WILL NOT WORK correctly and will likely throw an "auth/invalid-api-key" error or similar.\n\n` +
    `MISSING OR UNDEFINED VARIABLE(S) (checked via process.env.VAR_NAME):\n${missingKeys.map(k => `  - ${k} (Current value as seen by app: ${actualEnvVars[k]})`).join('\n')}\n\n` +
    `This usually means your .env.local file is missing, incorrectly named, in the wrong directory (must be project root),\n` +
    `or does not contain all the correct environment variables with their values.\n\n` +
    `--------------------------------------------------------------------------------------------------------\n` +
    `ACTION REQUIRED:\n` +
    `1. Ensure you have a file named exactly '.env.local' in your project's ROOT directory.\n` +
    `2. Ensure this file contains ALL of the following lines, replacing placeholders\n` +
    `   with your ACTUAL values from your Firebase project console (Project settings > General > Your apps > Config):\n\n` +
    `${envVarExamples.join('\n')}\n\n` +
    `3. IMPORTANT: You MUST RESTART your development server (e.g., stop it with Ctrl+C and run 'npm run dev' again)\n` +
    `   AFTER creating or modifying the .env.local file for changes to take effect.\n` +
    `   The "auth/invalid-api-key" error will persist if these variables are not correctly set and loaded.\n` +
    `--------------------------------------------------------------------------------------------------------\n` +
    `CURRENT VALUES ATTEMPTING TO BE USED BY THE APP (check for 'undefined' or incorrect values):\n`+
    `apiKey: ${firebaseConfigValues.apiKey}\n`+
    `authDomain: ${firebaseConfigValues.authDomain}\n`+
    `projectId: ${firebaseConfigValues.projectId}\n`+
    `storageBucket: ${firebaseConfigValues.storageBucket}\n`+
    `messagingSenderId: ${firebaseConfigValues.messagingSenderId}\n`+
    `appId: ${firebaseConfigValues.appId}\n` +
    `!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\n`;
  
  // Log the warning. If on client and already warned, consoleOutputFunction is a no-op.
  consoleOutputFunction(warningMessage);
}

const firebaseConfig = {
  apiKey: firebaseConfigValues.apiKey,
  authDomain: firebaseConfigValues.authDomain,
  projectId: firebaseConfigValues.projectId,
  storageBucket: firebaseConfigValues.storageBucket,
  messagingSenderId: firebaseConfigValues.messagingSenderId,
  appId: firebaseConfigValues.appId,
};

let app: FirebaseApp;
let db;

// Check if Firebase has already been initialized
if (!getApps().length) {
  try {
    // Only attempt to initialize if all essential keys might be present (or to let Firebase give its specific error)
    // This check primarily helps in guiding the user with our detailed logs if basic requirements aren't met.
    // Firebase's own `initializeApp` will throw if config is truly invalid (e.g., malformed API key).
    app = initializeApp(firebaseConfig);
  } catch (e: any) {
    // Ensure consoleOutputFunction is console.error for this critical catch block
    const criticalErrorLogger = typeof window !== 'undefined' ? console.error : console.error;
    criticalErrorLogger("Firebase initialization error in src/lib/firebase.ts:", e.message);

    if (e.message && (e.message.toLowerCase().includes("invalid-api-key") || e.code === 'auth/invalid-api-key')) {
         criticalErrorLogger(
          "DETAILED HINT for 'auth/invalid-api-key': The 'apiKey' value (NEXT_PUBLIC_FIREBASE_API_KEY) " +
          "is missing, incorrect, or the Firebase app for this key has been deleted or is not properly " +
          "configured for web usage in your Firebase project console. Double-check this value in your " +
          ".env.local file AND in your Firebase project settings (Project settings > General > Your apps > Config)."
        );
    }
     if (e.message && e.message.toLowerCase().includes("must be a non-empty string")){
        criticalErrorLogger(
          "DETAILED HINT: A Firebase config value (e.g. apiKey, authDomain, projectId) " +
          "is likely an empty string ''. Ensure all NEXT_PUBLIC_FIREBASE_... variables in .env.local have actual values."
        );
    }
    // If initialization fails, and no app instance exists, this is critical.
    // For robustness, we assign a placeholder to prevent further cascading errors here,
    // though auth and other Firebase services will fail later.
    if (!getApps().length) {
        criticalErrorLogger("CRITICAL: Firebase app failed to initialize and no app instance exists after attempt.");
        // Attempting to create a minimal app object to prevent immediate crashes on getAuth
        // This will still fail for actual Firebase operations but might prevent some cascading JS errors.
        app = {name: '[failed-initialization]', options: {}, automaticDataCollectionEnabled: false} as FirebaseApp;
    } else {
        app = getApps()[0]; // Should not happen if initializeApp failed and no apps were prior.
    }
  }
} else {
  app = getApps()[0];
}

// The getAuth() function will throw an error (like auth/invalid-api-key)
// if the app is not initialized correctly due to missing or invalid configuration.
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore only if the app was initialized successfully (or to let Firestore give its own error)
try {
    db = getFirestore(app);
} catch (e: any) {
    const criticalErrorLogger = typeof window !== 'undefined' ? console.error : console.error;
    criticalErrorLogger("Firestore initialization error in src/lib/firebase.ts:", e.message);
    // db will remain undefined, and subsequent Firestore operations will likely fail,
    // which should be handled by the calling code (e.g., API routes).
}


export { app, auth, googleProvider, db };