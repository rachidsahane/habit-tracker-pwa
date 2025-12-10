import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import { getWeekRange } from '../utils/dateUtils'

const WEEKLY_STATS_COLLECTION = 'weeklyStats'
const USERS_COLLECTION = 'users'

/**
 * Get week ID in format YYYY-Www (e.g., 2024-W50)
 */
function getWeekId(date = new Date()) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
    const week1 = new Date(d.getFullYear(), 0, 4)
    const weekNumber = Math.ceil(
        ((d.getTime() - week1.getTime()) / 86400000 + week1.getDay() + 1) / 7
    )
    return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

/**
 * Update user's weekly stats
 */
export async function updateWeeklyStats(userId, totalScheduled, totalCompleted) {
    try {
        const weekId = getWeekId()
        const percentage = totalScheduled > 0
            ? Math.round((totalCompleted / totalScheduled) * 100)
            : 0

        const statsRef = doc(db, WEEKLY_STATS_COLLECTION, `${weekId}_${userId}`)
        await setDoc(statsRef, {
            weekId,
            userId,
            totalScheduled,
            totalCompleted,
            percentage,
            lastUpdated: new Date().toISOString(),
        }, { merge: true })

        return { weekId, userId, percentage }
    } catch (error) {
        console.error('Error updating weekly stats:', error)
        throw error
    }
}

/**
 * Get leaderboard for a specific week
 */
export async function getWeeklyLeaderboard(weekId = null) {
    try {
        const targetWeekId = weekId || getWeekId()
        const statsRef = collection(db, WEEKLY_STATS_COLLECTION)
        const q = query(
            statsRef,
            where('weekId', '==', targetWeekId),
            orderBy('percentage', 'desc')
        )
        const snapshot = await getDocs(q)

        const stats = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))

        // Fetch user details for each stat
        const leaderboard = await Promise.all(
            stats.map(async (stat, index) => {
                try {
                    const userRef = doc(db, USERS_COLLECTION, stat.userId)
                    const userSnap = await getDoc(userRef)
                    const userData = userSnap.exists() ? userSnap.data() : {}

                    return {
                        ...stat,
                        rank: index + 1,
                        displayName: userData.displayName || 'Anonymous',
                        photoURL: userData.photoURL || null,
                        email: userData.email || null,
                    }
                } catch {
                    return {
                        ...stat,
                        rank: index + 1,
                        displayName: 'Anonymous',
                        photoURL: null,
                    }
                }
            })
        )

        return leaderboard
    } catch (error) {
        console.error('Error getting leaderboard:', error)
        throw error
    }
}

/**
 * Get user's rank for a specific week
 */
export async function getUserRank(userId, weekId = null) {
    try {
        const leaderboard = await getWeeklyLeaderboard(weekId)
        const userEntry = leaderboard.find((entry) => entry.userId === userId)
        return userEntry || { rank: leaderboard.length + 1, percentage: 0 }
    } catch (error) {
        console.error('Error getting user rank:', error)
        return { rank: 0, percentage: 0 }
    }
}

/**
 * Get last week's ID
 */
export function getLastWeekId() {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    return getWeekId(lastWeek)
}

/**
 * Subscribe to leaderboard updates
 */
export function subscribeToLeaderboard(weekId, callback) {
    const targetWeekId = weekId || getWeekId()
    const statsRef = collection(db, WEEKLY_STATS_COLLECTION)
    const q = query(
        statsRef,
        where('weekId', '==', targetWeekId),
        orderBy('percentage', 'desc')
    )

    return onSnapshot(q, async (snapshot) => {
        const stats = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }))

        // Fetch user details
        const leaderboard = await Promise.all(
            stats.map(async (stat, index) => {
                try {
                    const userRef = doc(db, USERS_COLLECTION, stat.userId)
                    const userSnap = await getDoc(userRef)
                    const userData = userSnap.exists() ? userSnap.data() : {}

                    return {
                        ...stat,
                        rank: index + 1,
                        displayName: userData.displayName || 'Anonymous',
                        photoURL: userData.photoURL || null,
                    }
                } catch {
                    return {
                        ...stat,
                        rank: index + 1,
                        displayName: 'Anonymous',
                        photoURL: null,
                    }
                }
            })
        )

        callback(leaderboard)
    }, (error) => {
        console.error('Error in leaderboard subscription:', error)
    })
}

export { getWeekId }
