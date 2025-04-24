// firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBFnM-KRV0iDfvDoVtKLm_B4o_iMLFD_fA",
  authDomain: "iu-bank.firebaseapp.com",
  projectId: "iu-bank",
  storageBucket: "iu-bank.firebasestorage.app",
  messagingSenderId: "1001151820058",
  appId: "1:1001151820058:web:6b6f8eada68de4f7d33ca3",
  measurementId: "G-8Z1HHCXE8X",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const analytics = getAnalytics(app);

auth.useDeviceLanguage();

// Export for SMS verification
export { auth, RecaptchaVerifier, signInWithPhoneNumber };