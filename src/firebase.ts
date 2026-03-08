import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyBqkxKqpR995woSyUZsybbDD2PCHA2QODU",
    authDomain: "project01-ea95b.firebaseapp.com",
    projectId: "project01-ea95b",
    storageBucket: "project01-ea95b.firebasestorage.app",
    messagingSenderId: "754340862942",
    appId: "1:754340862942:web:55328c993e6dd13a841b4f",
    measurementId: "G-8ERYMYYLDX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export default app;
