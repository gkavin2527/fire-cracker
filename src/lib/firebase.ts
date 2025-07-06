
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

if (typeof window !== 'undefined') { // Client-side
  if (!(window as any).__FIREBASE_CONFIG_WARNING_LOGGED__) {
    (window as any).__FIREBASE_CONFIG_WARNING_LOGGED__ = true;
  } else {
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
    `>>> Firebase client-side SDK WILL NOT INITIALIZE OR WORK CORRECTLY. Expect 'auth/invalid-api-key', 'auth/unauthorized-domain', or popup errors. <<<\n\n` +
    `One or more Firebase environment variables are MISSING or UNDEFINED.\n` +
    `This means your '.env.local' file is missing, incorrectly named, in the wrong directory (must be project root),\n` +
    `or does not contain all the correct environment variables with their values.\n\n` +
    `MISSING OR UNDEFINED VARIABLE(S) (checked via process.env.VAR_NAME):\n${missingKeys.map(k => `  - ${k} (Current value as seen by app: ${actualEnvVars[k]})`).join('\n')}\n\n` +
    `--------------------------------------------------------------------------------------------------------\n` +
    `ACTION REQUIRED:\n` +
    `1. Ensure you have a file named exactly '.env.local' in your project's ROOT directory.\n` +
    `2. Ensure this file contains ALL of the following lines, replacing placeholders\n` +
    `   with your ACTUAL values from your Firebase project console (Project settings > General > Your apps > Config for project 'firecrackers-7d9a3'):\n\n` +
    `${envVarExamples.join('\n')}\n\n` +
    `3. IMPORTANT: You MUST RESTART your development server (e.g., stop it with Ctrl+C and run 'npm run dev' again)\n` +
    `   AFTER creating or modifying the .env.local file for changes to take effect.\n` +
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
  const intendedProjectId = 'firecrackers-7d9a3'; // The project ID the user states they are using
  console.log(
    `%c[DIAGNOSTIC LOG from src/lib/firebase.ts - ${env} Environment]%c\n` +
    `Attempted projectId: '${firebaseConfig.projectId}' (Is this '${intendedProjectId}'? If NOT, your .env.local file has the WRONG Firebase project credentials, or is not being loaded by Next.js!)\n` +
    `Attempted authDomain: '${firebaseConfig.authDomain}' (Should match project '${intendedProjectId}')\n` +
    `Full Config Being Used: ${JSON.stringify(firebaseConfig, (key, value) => key === 'apiKey' ? '********' : value, 2)}\n` + // Mask API key in log
    `%c>>> IMPORTANT FOR 'auth/unauthorized-domain' OR 'auth/popup-closed-by-user' DEBUGGING <<<\n` +
    `>>> 1. Verify this 'projectId' and 'authDomain' EXACTLY MATCH your Firebase project ('${intendedProjectId}') settings where your development URL is authorized. <<<\n`+
    `>>> 2. If 'Attempted projectId' above IS NOT '${intendedProjectId}', your .env.local file HAS THE WRONG Firebase project credentials, or is not being loaded by Next.js (RESTART SERVER). <<<\n` +
    `>>> 3. Check your Firebase Console -> Authentication -> Settings -> Authorized Domains. Ensure your development URL ('${typeof window !== 'undefined' ? window.location.origin : 'your-dev-server-url'}') is listed. <<<`,
    'color: #FF4500; font-weight: bold; font-size: 1.1em;',
    'color: inherit;',
    'color: red; font-weight: bold;'
  );
};

if (typeof window !== 'undefined') {
  if (!(window as any).__FIREBASE_CLIENT_CONFIG_DIAGNOSTIC_LOGGED__) {
    logConfig('Client');
    (window as any).__FIREBASE_CLIENT_CONFIG_DIAGNOSTIC_LOGGED__ = true;
  }
} else {
  logConfig('Server');
}


let app: FirebaseApp;
let db;
let storage;

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
    if (app && app.name !== '[failed-initialization]') {
        db = getFirestore(app);
        storage = getStorage(app);
    } else {
        db = null; 
        storage = null;
        if (app.name === '[failed-initialization]') {
          console.error("Firestore and Storage NOT initialized because Firebase app initialization failed catastrophically.");
        }
    }
} catch (e: any) {
    const criticalErrorLogger = typeof window !== 'undefined' ? console.error : console.error;
    criticalErrorLogger("Firestore/Storage initialization error in src/lib/firebase.ts:", e.message);
    db = null;
    storage = null;
}


export { app, auth, googleProvider, db, storage };
