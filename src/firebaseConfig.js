// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth,GoogleAuthProvider,onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 


const firebaseConfig = {
  apiKey: "AIzaSyCFqIKwVFHhwdf-Jx2KO48Qjs_GSM7UPVo",
  authDomain: "innovative-teaching-feed-2d77a.firebaseapp.com",
  projectId: "innovative-teaching-feed-2d77a",
  storageBucket: "innovative-teaching-feed-2d77a.firebasestorage.app",
  messagingSenderId: "124488567481",
  appId: "1:124488567481:web:0e9bd86f62e8d356fb6968",
  measurementId: "G-Y3LN4WZJJX"
};


export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const  storage = getStorage(app);
export const provider = new GoogleAuthProvider();
//const analytics = getAnalytics(app);
