import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAlOeUpyn0aadTq92pF5QflqqX90hby4Kg",
  authDomain: "g-loja.firebaseapp.com",
  projectId: "g-loja",
  storageBucket: "g-loja.firebasestorage.app",
  messagingSenderId: "9506124082",
  appId: "1:9506124082:web:159f6b98efe825c5e5672b",
  measurementId: "G-HFVFV9LR7T",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
