
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// This warning will appear in your server console during development if the key is missing.
// The primary Firebase error "auth/invalid-api-key" will still occur if the key is invalid or missing when Firebase tries to initialize.
if (!apiKey) {
  console.warn(
    "\n********************************************************************************************************\n" +
    "CRITICAL WARNING: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or undefined.\n" +
    "Firebase WILL NOT WORK without it. This typically means your .env.local file is missing, \n" +
    "incorrectly named, in the wrong directory, or does not contain the correct environment variables.\n\n" +
    "Please ensure you have a .env.local file in your project root with the following content:\n" +
    "NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_from_firebase_console\n" +
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_from_firebase_console\n" +
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_from_firebase_console\n" +
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_from_firebase_console\n" +
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_from_firebase_console\n" +
    "NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_from_firebase_console\n\n" +
    "IMPORTANT: You MUST restart your development server (e.g., 'npm run dev') \n" +
    "AFTER creating or modifying the .env.local file for changes to take effect.\n" +
    "********************************************************************************************************\n"
  );
}

const firebaseConfig = {
  apiKey: apiKey, // Use the apiKey variable, which might be undefined if not set
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  // Firebase SDK will handle errors internally if config is incomplete or invalid.
  // For example, if apiKey is undefined, initializeApp will likely lead to errors
  // when services like getAuth are called.
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// The getAuth() function will throw an error (like auth/invalid-api-key)
// if the app is not initialized correctly due to missing or invalid configuration.
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
