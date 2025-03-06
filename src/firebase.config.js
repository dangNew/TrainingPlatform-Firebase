// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3s3ZcHjRfl3ntF6P1Az0bNRfW9ZQ-dr8",
  authDomain: "trainingplatform-48f63.firebaseapp.com",
  projectId: "trainingplatform-48f63",
  storageBucket: "trainingplatform-48f63.appspot.com", // Corrected storage bucket
  messagingSenderId: "784140665584",
  appId: "1:784140665584:web:67bf531e0e0e603f4d3835",
  measurementId: "G-34G8GJQFE1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export services for use in other files
export { app, analytics, db, auth, storage };
