import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// Debug logging
console.log("Firebase config values:", {
  apiKey: import.meta.env.VITE_API_KEY ? "***" : "MISSING",
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || "MISSING",
  projectId: import.meta.env.VITE_PROJECT_ID || "MISSING",
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET || "MISSING",
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID || "MISSING",
  appId: import.meta.env.VITE_APP_ID || "MISSING"
});

// Validate Firebase config
const isFirebaseConfigValid = Object.values(firebaseConfig).every(value => value && value !== '');

console.log("Is Firebase config valid:", isFirebaseConfigValid);

// Initialize Firebase only if config is valid
let app, db, auth, storage;

if (isFirebaseConfigValid) {
  try {
    console.log("Initializing Firebase app...");
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully");
    
    console.log("Initializing Firestore...");
    db = getFirestore(app);
    console.log("Firestore initialized successfully");
    
    console.log("Initializing Auth...");
    auth = getAuth(app);
    // Set persistence to local storage to maintain session across browser restarts
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Auth persistence set to browser local storage");
      })
      .catch((error) => {
        console.error("Error setting auth persistence:", error);
      });
    console.log("Auth initialized successfully");
    
    console.log("Initializing Storage...");
    storage = getStorage(app);
    console.log("Storage initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
  }
} else {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value || value === '')
    .map(([key]) => key);
  
  console.warn("Firebase configuration is missing or incomplete. Missing keys:", missingKeys);
  console.warn("Please check your .env file and ensure all Firebase config variables are set.");
}

export { db, auth, app, storage, GoogleAuthProvider };