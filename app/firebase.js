import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAFaEfnNJV0scysZgY6InATBXCmm6CVr-Q",
  authDomain: "financetracker-c70f9.firebaseapp.com",
  projectId: "financetracker-c70f9",
  storageBucket: "financetracker-c70f9.firebasestorage.app",
  messagingSenderId: "731652994316",
  appId: "1:731652994316:web:605afc64c7f0ea3f4f4529"
};

const app = initializeApp(firebaseConfig);
export default app;