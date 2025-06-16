
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const expectedKeys: (keyof typeof firebaseConfigValues)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const missingKeys: string[] = [];
const envVarInstructions: string[] = [];

expectedKeys.forEach(keyName => {
  const envVarName = `NEXT_PUBLIC_FIREBASE_${keyName.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
  if (!firebaseConfigValues[keyName]) {
    missingKeys.push(envVarName);
  }
  envVarInstructions.push(`${envVarName}=your_actual_${keyName}_from_firebase_console`);
});

if (missingKeys.length > 0) {
  console.warn(
    `\n********************************************************************************************************\n` +
    `CRITICAL WARNING: One or more Firebase environment variables are missing or undefined.\n` +
    `Firebase WILL NOT WORK correctly without them. Missing variable(s): \n${missingKeys.map(k => `  - ${k}`).join('\n')}\n\n` +
    `This typically means your .env.local file is missing, incorrectly named, in the wrong directory, \n` +
    `or does not contain all the correct environment variables with their values.\n\n` +
    `Please ensure you have a .env.local file in your project root with ALL of the following (replace placeholders with your actual values from your Firebase project console):\n` +
    `${envVarInstructions.join('\n')}\n\n` +
    `IMPORTANT: You MUST restart your development server (e.g., by stopping it with Ctrl+C and running 'npm run dev' again) \n` +
    `AFTER creating or modifying the .env.local file for changes to take effect.\n` +
    `The error "Firebase: Error (auth/invalid-api-key)" will persist if these variables are not correctly set and loaded.\n` +
    `********************************************************************************************************\n`
  );
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

// The getAuth() function will throw an error (like auth/invalid-api-key)
// if the app is not initialized correctly due to missing or invalid configuration.
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
