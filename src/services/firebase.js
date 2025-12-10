import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Get this from Firebase Console > Project Settings > Your Apps > Config
const firebaseConfig = {
    apiKey: "AIzaSyD2bnfNTNjJ4XyVFlM_1PzvGMmnc69VqX8",
    authDomain: "habit-tracker-pwa-e5a97.firebaseapp.com",
    projectId: "habit-tracker-pwa-e5a97",
    storageBucket: "habit-tracker-pwa-e5a97.firebasestorage.app",
    messagingSenderId: "600484609036",
    appId: "1:600484609036:web:0650ca5337d57f1b02c229",
    measurementId: "G-M990KPRLXC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Analytics (only if supported)
isSupported().then((supported) => {
    if (supported) {
        getAnalytics(app)
    }
})

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
