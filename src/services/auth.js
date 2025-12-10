import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const googleProvider = new GoogleAuthProvider()

/**
 * Sign in with Google popup
 * Creates user profile in Firestore if first time
 */
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider)
        const user = result.user

        // Check if user profile exists in Firestore
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        // Create user profile if it doesn't exist
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
            })
        }

        return user
    } catch (error) {
        console.error('Error signing in with Google:', error)
        throw error
    }
}

/**
 * Sign out the current user
 */
export async function signOut() {
    try {
        await firebaseSignOut(auth)
    } catch (error) {
        console.error('Error signing out:', error)
        throw error
    }
}

/**
 * Get the current user's profile from Firestore
 */
export async function getUserProfile(userId) {
    try {
        const userRef = doc(db, 'users', userId)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() }
        }
        return null
    } catch (error) {
        console.error('Error getting user profile:', error)
        throw error
    }
}
