// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCwZQi006Ba9wOC4WdSxwFh3pkDUASn5pA",
    authDomain: "flowerbase-b9b22.firebaseapp.com",
    projectId: "flowerbase-b9b22",
    storageBucket: "flowerbase-b9b22.firebasestorage.app",
    messagingSenderId: "343139704038",
    appId: "1:343139704038:web:245dc7c9531c8e86d72f27",
    measurementId: "G-QVT2QDER2L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (database)
export const db = getFirestore(app);

// Initialize Storage (for images)
export const storage = getStorage(app);

export default app;
