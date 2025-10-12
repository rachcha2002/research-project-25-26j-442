import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration (use your Firebase project details)
const firebaseConfig = {
  apiKey: "AIzaSyBCpTCiKLVGJpWu1J72lAhfWB1Gog9D75s",
  authDomain: "peditrack24.firebaseapp.com",
  projectId: "peditrack24",
  storageBucket: "peditrack24.appspot.com",
  messagingSenderId: "12048349008",
  appId: "1:12048349008:web:8f792ba332797b4b2f5e55",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
