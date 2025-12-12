import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const USERS_COLLECTION = 'users'

/**
 * Update user profile or settings
 */
export async function updateUserSettings(userId, data) {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId)
        await setDoc(userRef, data, { merge: true })
        return true
    } catch (error) {
        console.error('Error updating user settings:', error)
        throw error
    }
}

export async function getUserProfile(userId) {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId)
        const snapshot = await getDoc(userRef)
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() }
        }
        return null
    } catch (error) {
        console.error('Error getting user profile:', error)
        throw error
    }
}
