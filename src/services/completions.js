import {
    collection,
    doc,
    addDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { formatDate } from '../utils/dateUtils'

const COMPLETIONS_COLLECTION = 'completions'

/**
 * Mark a habit as completed for a specific date
 */
export async function addCompletion(habitId, userId, date, value = true) {
    try {
        const completionsRef = collection(db, COMPLETIONS_COLLECTION)
        const docRef = await addDoc(completionsRef, {
            habitId,
            userId,
            date, // Format: 'YYYY-MM-DD'
            value,
            type: 'completion', // Explicitly mark as completion
            timestamp: serverTimestamp(),
        })
        return { id: docRef.id, habitId, userId, date, value }
    } catch (error) {
        console.error('Error adding completion:', error)
        throw error
    }
}

/**
 * Record a lost streak event
 */
export async function addStreakLossEvent(habitId, userId, streakLength) {
    try {
        const completionsRef = collection(db, COMPLETIONS_COLLECTION)
        await addDoc(completionsRef, {
            habitId,
            userId,
            date: formatDate(new Date()),
            streakLength,
            type: 'streak_lost',
            timestamp: serverTimestamp(),
        })
    } catch (error) {
        console.error('Error adding streak loss event:', error)
    }
}

/**
 * Remove a completion (unmark as complete)
 */
export async function removeCompletion(habitId, userId, date) {
    try {
        const completionsRef = collection(db, COMPLETIONS_COLLECTION)
        const q = query(
            completionsRef,
            where('habitId', '==', habitId),
            where('userId', '==', userId),
            where('date', '==', date)
        )
        const snapshot = await getDocs(q)

        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
        await Promise.all(deletePromises)

        return { habitId, userId, date }
    } catch (error) {
        console.error('Error removing completion:', error)
        throw error
    }
}

/**
 * Toggle completion - add if not exists, remove if exists
 */
export async function toggleCompletion(habitId, userId, date, value = true) {
    try {
        const completionsRef = collection(db, COMPLETIONS_COLLECTION)
        const q = query(
            completionsRef,
            where('habitId', '==', habitId),
            where('userId', '==', userId),
            where('date', '==', date)
        )
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
            // Add completion
            return await addCompletion(habitId, userId, date, value)
        } else {
            // Remove completion
            await removeCompletion(habitId, userId, date)
            return null
        }
    } catch (error) {
        console.error('Error toggling completion:', error)
        throw error
    }
}

/**
 * Update completion value (for numerical habits)
 * Creates if not exists, updates if exists, removes if value <= 0
 */
export async function updateCompletionValue(habitId, userId, date, value) {
    try {
        if (value <= 0) {
            await removeCompletion(habitId, userId, date)
            return null
        }

        const completionsRef = collection(db, COMPLETIONS_COLLECTION)
        const q = query(
            completionsRef,
            where('habitId', '==', habitId),
            where('userId', '==', userId),
            where('date', '==', date)
        )
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
            return await addCompletion(habitId, userId, date, value)
        } else {
            // Update existing
            const docRef = snapshot.docs[0].ref
            await deleteDoc(docRef) // Simplest way to "update" in this architecture without separate update func, or we could use updateDoc
            // Actually, better to use setDoc or updateDoc but we need to import them. 
            // Reuse addCompletion for consistency with current flow? No, that creates duplicates if we don't delete.
            // Let's just use addCompletion after delete, effectively a replace.
            return await addCompletion(habitId, userId, date, value)
        }
    } catch (error) {
        console.error('Error updating completion value:', error)
        throw error
    }
}

/**
 * Get all completions for a user on a specific date
 */
export async function getCompletionsForDate(userId, date) {
    try {
        const completionsRef = collection(db, COMPLETIONS_COLLECTION)
        const q = query(
            completionsRef,
            where('userId', '==', userId),
            where('date', '==', date)
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))
    } catch (error) {
        console.error('Error getting completions:', error)
        throw error
    }
}

/**
 * Get completions for a date range (for weekly stats)
 */
export async function getCompletionsForRange(userId, startDate, endDate) {
    try {
        const completionsRef = collection(db, COMPLETIONS_COLLECTION)
        const q = query(
            completionsRef,
            where('userId', '==', userId),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))
    } catch (error) {
        console.error('Error getting completions range:', error)
        throw error
    }
}

/**
 * Subscribe to real-time completion updates for a user
 */
export function subscribeToCompletions(userId, callback) {
    const completionsRef = collection(db, COMPLETIONS_COLLECTION)
    const q = query(
        completionsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
        const completions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))
        callback(completions)
    }, (error) => {
        console.error('Error in completions subscription:', error)
    })
}

/**
 * Get recent public completions for progress feed
 */
export async function getRecentPublicCompletions(limit = 50) {
    try {
        const completionsRef = collection(db, COMPLETIONS_COLLECTION)
        const q = query(
            completionsRef,
            orderBy('timestamp', 'desc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.slice(0, limit).map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))
    } catch (error) {
        console.error('Error getting public completions:', error)
        throw error
    }
}

/**
 * Calculate streak for a habit based on completions
 */
export async function calculateStreak(habitId, userId, habit) {
    try {
        const completionsRef = collection(db, COMPLETIONS_COLLECTION)
        const q = query(
            completionsRef,
            where('habitId', '==', habitId),
            where('userId', '==', userId),
            orderBy('date', 'desc')
        )
        const snapshot = await getDocs(q)
        const completions = snapshot.docs.map((doc) => doc.data().date)

        if (completions.length === 0) return 0

        let streak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        let currentDate = new Date(today)

        const shouldTrackOnDay = (date) => {
            if (habit.frequency === 'daily') return true
            if (habit.frequency === 'custom' && habit.customDays) {
                return habit.customDays.includes(date.getDay())
            }
            return true
        }

        const completionSet = new Set(completions)

        while (true) {
            // FIX: Use local date formatting instead of UTC to avoid timezone issues
            const dateStr = formatDate(currentDate)

            if (!shouldTrackOnDay(currentDate)) {
                currentDate.setDate(currentDate.getDate() - 1)
                continue
            }

            if (currentDate.getTime() === today.getTime() && !completionSet.has(dateStr)) {
                currentDate.setDate(currentDate.getDate() - 1)
                continue
            }

            if (completionSet.has(dateStr)) {
                streak++
                currentDate.setDate(currentDate.getDate() - 1)
            } else {
                break
            }

            if (streak > 1000) break
        }

        return streak
    } catch (error) {
        console.error('Error calculating streak:', error)
        return 0
    }
}
