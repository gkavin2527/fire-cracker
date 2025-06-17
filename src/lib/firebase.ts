
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
let consoleOutputFunction = console.error; // Default to error for server
let hasLoggedClientWarning = false;

if (typeof window !== 'undefined') { // Client-side
  if (!(window as any).__FIREBASE_CONFIG_WARNING_LOGGED__) {
    (window as any).__FIREBASE_CONFIG_WARNING_LOGGED__ = true; // Set flag after first log
  } else {
    consoleOutputFunction = () => {}; // Suppress subsequent client-side logs
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
  actualEnvVars[envVarName] = process.env[envVarName];

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
    `Firebase WILL NOT WORK correctly and will likely throw an "auth/invalid-api-key" or "auth/unauthorized-domain" error.\n\n` +
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
    `   These errors will persist if these variables are not correctly set and loaded.\n` +
    `--------------------------------------------------------------------------------------------------------\n` +
    `CURRENT VALUES ATTEMPTING TO BE USED BY THE APP (check for 'undefined' or incorrect values):\n`+
    `apiKey: ${firebaseConfigValues.apiKey}\n`+
    `authDomain: ${firebaseConfigValues.authDomain}\n`+
    `projectId: ${firebaseConfigValues.projectId}\n`+
    `storageBucket: ${firebaseConfigValues.storageBucket}\n`+
    `messagingSenderId: ${firebaseConfigValues.messagingSenderId}\n`+
    `appId: ${firebaseConfigValues.appId}\n` +
    `!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\n`;
  
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

// Log the actual config being used for diagnostics
const logConfig = (env: string) => {
  console.log(
    `%c[DEBUG] Firebase config loaded by app (src/lib/firebase.ts - ${env}):%c\n` +
    `%c>>> IMPORTANT FOR 'auth/unauthorized-domain' DEBUGGING <<<\n` +
    `>>> Verify this 'projectId' and 'authDomain' MATCH your Firebase project ('firecrackers-7d9a3') settings where 'localhost' is authorized. <<<\n`+
    `Config: ${JSON.stringify(firebaseConfig, null, 2)}`,
    'color: blue; font-weight: bold;',
    'color: inherit;',
    'color: red; font-weight: bold;'
  );
};

if (typeof window !== 'undefined') {
  // Client-side: Log only once to avoid spamming if HMR or other re-renders occur.
  if (!hasLoggedClientWarning && !(window as any).__FIREBASE_CLIENT_CONFIG_LOGGED__) {
    logConfig('Client');
    (window as any).__FIREBASE_CLIENT_CONFIG_LOGGED__ = true;
    hasLoggedClientWarning = true; // Use a module-level flag as well
  }
} else {
  // Server-side: Log every time the module is initialized (typically once per server start/restart)
  logConfig('Server');
}


let app: FirebaseApp;
let db;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e: any) {
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
    if (!getApps().length) {
        criticalErrorLogger("CRITICAL: Firebase app failed to initialize and no app instance exists after attempt.");
        // Provide a dummy app object to prevent further crashes if auth or db are accessed
        app = {name: '[failed-initialization]', options: {}, automaticDataCollectionEnabled: false} as FirebaseApp;
    } else {
        app = getApps()[0]; 
    }
  }
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

try {
    // Only try to get Firestore if the app object looks somewhat valid (not the dummy one)
    if (app && app.name !== '[failed-initialization]') {
        db = getFirestore(app);
    } else {
        db = null; // Explicitly set to null if app initialization failed
        console.error("Firestore NOT initialized because Firebase app initialization failed.");
    }
} catch (e: any) {
    const criticalErrorLogger = typeof window !== 'undefined' ? console.error : console.error;
    criticalErrorLogger("Firestore initialization error in src/lib/firebase.ts:", e.message);
    db = null;
}


export { app, auth, googleProvider, db };

    