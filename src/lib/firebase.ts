
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
let consoleOutputFunction = console.warn; 

if (typeof window !== 'undefined') {
  consoleOutputFunction = console.log;
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
    `CRITICAL FIREBASE CONFIGURATION WARNING:\n` +
    `One or more Firebase environment variables are MISSING or UNDEFINED.\n` +
    `Firebase WILL NOT WORK correctly and will likely throw an "auth/invalid-api-key" error.\n\n` +
    `MISSING OR UNDEFINED VARIABLE(S):\n${missingKeys.map(k => `  - ${k} (Current value in process.env: ${actualEnvVars[k]})`).join('\n')}\n\n` +
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
  
  if (typeof window !== 'undefined') {
    setTimeout(() => consoleOutputFunction(warningMessage), 100);
  } else {
    consoleOutputFunction(warningMessage);
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
  try {
    app = initializeApp(firebaseConfig);
  } catch (e: any) {
    console.error("Firebase initialization error:", e.message);
    if (e.message && e.message.includes("auth/invalid-api-key")) {
         console.error(
          "DETAILED HINT: The 'auth/invalid-api-key' error specifically means that the 'apiKey' value (NEXT_PUBLIC_FIREBASE_API_KEY) is missing, incorrect, or the Firebase app for this key has been deleted or is not properly configured for web usage in your Firebase project console. Double-check this value in your .env.local file AND in your Firebase project settings."
        );
    }
    // Re-throw the error or handle it as appropriate for your app if initialization truly fails
    // For now, we'll proceed to getAuth which will likely also fail and show the error, but we've logged details.
    // In a production app, you might want to set a global error state here.
    // Attempting to get/initialize app again can lead to further issues if the config is bad.
    // So, if an error occurs, app might be undefined.
    // We will just let the subsequent getAuth call fail, which is what the user is seeing.
    // The critical part is the console logging above.
    
    // To ensure 'app' is assigned, even if initialization fails,
    // we assign a placeholder or re-throw to prevent `getAuth` from getting an undefined `app`.
    // However, the best approach is to let the original error propagate or handle it gracefully.
    // For this scenario, we'll allow `getAuth` to fail if `initializeApp` failed.
    // The console logs are the most important part for the user to debug.
    if (!getApps().length) { // Check again if initializeApp failed to create an app instance
        // This path means initializeApp threw and there's still no app.
        // This is a critical failure. We can't proceed.
        // Throwing here makes it clear initialization failed.
        throw new Error(`Firebase app initialization failed critically. Check console for details. Original error: ${e.message}`);
    } else {
        app = getApps()[0]; // It might have been initialized by another part if error was non-fatal
    }
  }
} else {
  app = getApps()[0];
}

// The getAuth() function will throw an error (like auth/invalid-api-key)
// if the app is not initialized correctly due to missing or invalid configuration.
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };

