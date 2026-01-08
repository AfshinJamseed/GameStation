// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// TODO: Replace the object below with your actual Firebase Config
// 1. Go to console.firebase.google.com
// 2. Click "Add project" and follow steps
// 3. Go to Project Settings (gear icon) -> General
// 4. Scroll down to "Your apps" -> Click "</>" icon
// 5. Copy the 'firebaseConfig' object and paste it here:

const firebaseConfig = {
  apiKey: "AIzaSyCtOLVK7F7FPh6-DLDVwYGqimL3PUp5qgg",
  authDomain: "gamestation-d3529.firebaseapp.com",
  projectId: "gamestation-d3529",
  storageBucket: "gamestation-d3529.firebasestorage.app",
  messagingSenderId: "166517846972",
  appId: "1:166517846972:web:0417bad59d2f94a4d9f1b9",
  measurementId: "G-MEBQB6NVHE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
