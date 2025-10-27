// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4nFqKlZ4MhHmcT5Ha_PLIjrL0MKt3EIU",
  authDomain: "populite-b575c.firebaseapp.com",
  projectId: "populite-b575c",
  storageBucket: "populite-b575c.firebasestorage.app",
  messagingSenderId: "436580616531",
  appId: "1:436580616531:web:308c390c767ec5db53f9a6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export const
export const auth = getAuth(app);
export const db = getFirestore(app);
