import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
    doc,
    getDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const COMPLETIONS_COLLECTION = 'completions'
const HABITS_COLLECTION = 'habits'
const USERS_COLLECTION = 'users'

/**
 * Get recent public completions with habit and user details
 */
export async function getPublicFeed(limitCount = 50) {
    try {
        // Get recent completions
        const completionsRef = collection(db, COMPLETIONS_COLLECTION)
        const q = query(
            completionsRef,
            orderBy('timestamp', 'desc'),
            limit(limitCount * 2) // Get extra to filter for public habits
        )
        const snapshot = await getDocs(q)
        const completions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))

        // Build feed items with habit and user details
        const feedItems = []
        const processedHabitIds = new Set()

        for (const completion of completions) {
            if (feedItems.length >= limitCount) break
            if (processedHabitIds.has(`${completion.habitId}_${completion.date}`)) continue

            try {
                // Get habit details
                const habitRef = doc(db, HABITS_COLLECTION, completion.habitId)
                const habitSnap = await getDoc(habitRef)

                if (!habitSnap.exists()) continue

                const habit = habitSnap.data()

                // Only include public habits
                if (!habit.isPublic) continue

                // Get user details
                const userRef = doc(db, USERS_COLLECTION, completion.userId)
                const userSnap = await getDoc(userRef)
                const user = userSnap.exists() ? userSnap.data() : {}

                feedItems.push({
                    id: completion.id,
                    habitId: completion.habitId,
                    habitTitle: habit.title,
                    userId: completion.userId,
                    username: user.displayName || 'Anonymous',
                    photoURL: user.photoURL || null,
                    streak: habit.currentStreak || 0,
                    timestamp: completion.timestamp,
                    date: completion.date,
                    type: 'completion',
                })

                processedHabitIds.add(`${completion.habitId}_${completion.date}`)
            } catch (error) {
                console.error('Error processing completion:', error)
                continue
            }
        }

        return feedItems
    } catch (error) {
        console.error('Error getting public feed:', error)
        throw error
    }
}

/**
 * Get time ago string from date
 */
export function getTimeAgo(timestamp) {
    if (!timestamp) return ''

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
}

/**
 * Subscribe to real-time public feed updates
 */
export function subscribeToPublicFeed(callback, limitCount = 50) {
    const completionsRef = collection(db, COMPLETIONS_COLLECTION)
    const q = query(
        completionsRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    )

    return onSnapshot(q, async (snapshot) => {
        try {
            const feed = await getPublicFeed(limitCount)
            callback(feed)
        } catch (error) {
            console.error('Error in feed subscription:', error)
        }
    }, (error) => {
        console.error('Error in feed snapshot:', error)
    })
}
