
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

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
    `CRITICAL FIREBASE CONFIGURATION WARNING:\n` +
    `One or more Firebase environment variables are MISSING or UNDEFINED.\n` +
    `Firebase WILL NOT WORK correctly and will likely throw an "auth/invalid-api-key" error.\n\n` +
    `MISSING OR UNDEFINED VARIABLE(S):\n${missingKeys.map(k => `  - ${k} (Current value: ${actualEnvVars[k]})`).join('\n')}\n\n` +
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
    `!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\n`;
  
  if (typeof window === 'undefined') {
    console.warn(warningMessage);
  } else {
    setTimeout(() => console.warn(warningMessage), 0);
  }
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
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };

    