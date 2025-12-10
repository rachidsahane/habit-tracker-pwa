import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const HABITS_COLLECTION = 'habits'

/**
 * Create a new habit in Firestore
 */
export async function createHabit(userId, habitData) {
    try {
        const habitsRef = collection(db, HABITS_COLLECTION)
        const docRef = await addDoc(habitsRef, {
            ...habitData,
            userId,
            currentStreak: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        })
        return { id: docRef.id, ...habitData, userId, currentStreak: 0 }
    } catch (error) {
        console.error('Error creating habit:', error)
        throw error
    }
}

/**
 * Get all habits for a user
 */
export async function getUserHabits(userId) {
    try {
        const habitsRef = collection(db, HABITS_COLLECTION)
        const q = query(
            habitsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))
    } catch (error) {
        console.error('Error getting habits:', error)
        throw error
    }
}

/**
 * Get a single habit by ID
 */
export async function getHabit(habitId) {
    try {
        const habitRef = doc(db, HABITS_COLLECTION, habitId)
        const snapshot = await getDoc(habitRef)
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() }
        }
        return null
    } catch (error) {
        console.error('Error getting habit:', error)
        throw error
    }
}

/**
 * Update a habit
 */
export async function updateHabit(habitId, updates) {
    try {
        const habitRef = doc(db, HABITS_COLLECTION, habitId)
        await updateDoc(habitRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        })
        return { id: habitId, ...updates }
    } catch (error) {
        console.error('Error updating habit:', error)
        throw error
    }
}

/**
 * Delete a habit
 */
export async function deleteHabit(habitId) {
    try {
        const habitRef = doc(db, HABITS_COLLECTION, habitId)
        await deleteDoc(habitRef)
        return habitId
    } catch (error) {
        console.error('Error deleting habit:', error)
        throw error
    }
}

/**
 * Subscribe to real-time updates for a user's habits
 */
export function subscribeToHabits(userId, callback) {
    const habitsRef = collection(db, HABITS_COLLECTION)
    const q = query(
        habitsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
        const habits = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))
        callback(habits)
    }, (error) => {
        console.error('Error in habits subscription:', error)
    })
}

/**
 * Get all public habits (for progress feed)
 */
export async function getPublicHabits(limit = 50) {
    try {
        const habitsRef = collection(db, HABITS_COLLECTION)
        const q = query(
            habitsRef,
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.slice(0, limit).map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))
    } catch (error) {
        console.error('Error getting public habits:', error)
        throw error
    }
}
