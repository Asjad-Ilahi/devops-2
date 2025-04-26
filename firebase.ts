// firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAPRYPiKl7DWuIhj4WZHSAv3u6yBKY2xzc",
  authDomain: "iubanking.firebaseapp.com",
  projectId: "iubanking",
  storageBucket: "iubanking.firebasestorage.app",
  messagingSenderId: "561757196413",
  appId: "1:561757196413:web:331924a0e4f58df1f22114",
  measurementId: "G-5LJX2XWZDN"
};


// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const analytics = getAnalytics(app);

auth.useDeviceLanguage();

// Export for SMS verification
export { auth, RecaptchaVerifier, signInWithPhoneNumber };