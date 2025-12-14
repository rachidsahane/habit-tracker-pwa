import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth, db } from './firebase'
import { doc, updateDoc } from 'firebase/firestore'

const CALENDAR_TOKEN_KEY = 'gcal_token'
const TOKEN_EXPIRY_MS = 50 * 60 * 1000 // 50 minutes

/**
 * Store calendar token with expiry
 */
function storeCalendarToken(token) {
    const data = {
        token,
        expiry: Date.now() + TOKEN_EXPIRY_MS
    }
    localStorage.setItem(CALENDAR_TOKEN_KEY, JSON.stringify(data))
}

/**
 * Get calendar token if not expired
 */
function getCalendarToken() {
    const stored = localStorage.getItem(CALENDAR_TOKEN_KEY)
    if (!stored) return null

    const data = JSON.parse(stored)
    if (Date.now() > data.expiry) {
        localStorage.removeItem(CALENDAR_TOKEN_KEY)
        return null
    }

    return data.token
}

/**
 * Auto-sync a single habit (for create/update operations)
 * Silently fails if no token available
 */
export async function autoSyncHabit(habit, userId) {
    const token = getCalendarToken()
    if (!token) return // Silently skip if no token

    try {
        await syncSingleHabit(habit, token, userId)
    } catch (error) {
        console.warn('Auto-sync failed:', error.message)
    }
}

/**
 * Delete a habit from calendar
 */
export async function deleteCalendarEvent(googleEventId) {
    const token = getCalendarToken()
    if (!token || !googleEventId) return

    try {
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`
        await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
    } catch (error) {
        console.warn('Failed to delete calendar event:', error.message)
    }
}

/**
 * Check if calendar is connected
 */
export function isCalendarConnected() {
    return !!getCalendarToken()
}

/**
 * Syncs user habits to Google Calendar
 */
export async function syncHabitsToCalendar(habits, userId) {
    console.log('🔄 Starting Calendar Sync...')

    // 1. Authenticate with Calendar Scope
    const provider = new GoogleAuthProvider()
    provider.addScope('https://www.googleapis.com/auth/calendar.events')

    // CRITICAL: Force OAuth to use the same account as Firebase Auth
    const currentUser = auth.currentUser
    if (currentUser?.email) {
        provider.setCustomParameters({
            login_hint: currentUser.email
        })
        console.log(`🔐 Forcing OAuth for: ${currentUser.email}`)
    }

    let accessToken
    try {
        const result = await signInWithPopup(auth, provider)
        const credential = GoogleAuthProvider.credentialFromResult(result)
        accessToken = credential.accessToken

        if (!accessToken) throw new Error('No access token returned')

        // Store token for future auto-syncs
        storeCalendarToken(accessToken)
        console.log('✅ OAuth successful, token stored')
    } catch (error) {
        console.error('❌ Calendar Auth Error:', error)
        throw new Error('Failed to authorize Google Calendar access')
    }

    // 2. Iterate and Sync Habits
    let successCount = 0
    let failCount = 0
    const errors = []

    console.log(`📋 Syncing ${habits.length} habits...`)
    for (const habit of habits) {
        try {
            await syncSingleHabit(habit, accessToken, userId)
            successCount++
        } catch (error) {
            console.error(`❌ Failed to sync habit: ${habit.title}`, error)
            failCount++
            errors.push(`${habit.title}: ${error.message}`)
        }
    }

    console.log(`✅ Sync complete: ${successCount} succeeded,  ${failCount} failed`)
    return { success: successCount, failed: failCount, errors }
}

async function syncSingleHabit(habit, token, userId) {
    const event = createEventBody(habit)

    // Determine if creating or updating
    const isUpdate = !!habit.googleEventId
    const method = isUpdate ? 'PATCH' : 'POST'
    const url = isUpdate
        ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${habit.googleEventId}`
        : `https://www.googleapis.com/calendar/v3/calendars/primary/events`

    console.log(`📤 ${method} event for "${habit.title}"...`)
    console.log('📋 Event body:', JSON.stringify(event, null, 2))

    const response = await fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
    })

    if (!response.ok) {
        // If 404 (Event deleted in Calendar), try creating a new one
        if (response.status === 404 && isUpdate) {
            console.warn('⚠️ Event not found, creating new one...')
            const cleanHabit = { ...habit, googleEventId: null }
            return syncSingleHabit(cleanHabit, token, userId)
        }

        const errData = await response.json()
        console.error('❌ API Error:', errData)
        throw new Error(errData.error?.message || 'Calendar API Error')
    }

    const data = await response.json()
    console.log(`✅ Event created/updated for "${habit.title}"`)
    console.log('📍 Event details:', {
        id: data.id,
        htmlLink: data.htmlLink,
        summary: data.summary,
        start: data.start,
        end: data.end,
        recurrence: data.recurrence
    })

    // Save event ID if new (ignore errors - event is already created in Google)
    if (!habit.googleEventId || habit.googleEventId !== data.id) {
        try {
            const habitRef = doc(db, 'habits', habit.id)
            await updateDoc(habitRef, { googleEventId: data.id })
        } catch (err) {
            console.warn('⚠️ Could not save eventId to Firestore:', err.message)
        }
    }
}

/**
 * Calculate the next occurrence date for recurring events
 * Prevents the "Sunday bug" where all events start on current day
 */
function getNextOccurrenceDate(habit) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Daily habits can start today
    if (habit.frequency === 'daily') {
        return today
    }

    // Weekly habits start on the same day of week they were created
    if (habit.frequency === 'weekly') {
        const createdDate = habit.createdAt?.toDate?.() || new Date(habit.createdAt)
        const targetDayOfWeek = createdDate.getDay()
        const currentDayOfWeek = today.getDay()

        let daysUntilNext = targetDayOfWeek - currentDayOfWeek
        if (daysUntilNext < 0) daysUntilNext += 7

        const nextDate = new Date(today)
        nextDate.setDate(today.getDate() + daysUntilNext)
        return nextDate
    }

    // Custom habits: find the next day that matches customDays
    if (habit.frequency === 'custom' && habit.customDays?.length > 0) {
        const currentDayOfWeek = today.getDay()

        // Find the next matching day
        for (let i = 0; i < 7; i++) {
            const checkDay = (currentDayOfWeek + i) % 7
            if (habit.customDays.includes(checkDay)) {
                const nextDate = new Date(today)
                nextDate.setDate(today.getDate() + i)
                return nextDate
            }
        }
    }

    // Fallback to today
    return today
}

function createEventBody(habit) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // RRULE Generation - FIXED with object mapping
    let recurrence = []
    if (habit.frequency === 'daily') {
        recurrence = ['RRULE:FREQ=DAILY']
    } else if (habit.frequency === 'weekly') {
        recurrence = ['RRULE:FREQ=WEEKLY']
    } else if (habit.frequency === 'custom' && habit.customDays?.length > 0) {
        // customDays contains JS day numbers: 0=Sunday, 1=Monday, etc.
        // CRITICAL FIX: Use OBJECT not array for proper day mapping
        const dayMap = {
            0: 'SU', // Sunday
            1: 'MO', // Monday
            2: 'TU', // Tuesday
            3: 'WE', // Wednesday
            4: 'TH', // Thursday
            5: 'FR', // Friday
            6: 'SA'  // Saturday
        }
        const apiDays = habit.customDays
            .map(dayNum => dayMap[dayNum])
            .filter(Boolean)
            .join(',')

        if (apiDays) {
            recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${apiDays}`]
        }
    }

    // Determine if timed or all-day
    const hasTime = !!habit.reminderTime
    console.log(`📅 Creating event for "${habit.title}": reminderTime=${habit.reminderTime}, hasTime=${hasTime}, recurrence=${recurrence}`)

    if (hasTime) {
        // Timed event (1 hour duration)
        const startDate = getNextOccurrenceDate(habit)
        const startDateStr = startDate.toISOString().split('T')[0]
        const startDateTime = `${startDateStr}T${habit.reminderTime}:00`
        const startDateFull = new Date(startDateTime)
        const endDate = new Date(startDateFull.getTime() + 60 * 60000) // 1 hour

        // Format as RFC3339 with timezone offset (NOT UTC 'Z')
        const formatRFC3339 = (date) => {
            const offset = -date.getTimezoneOffset()
            const sign = offset >= 0 ? '+' : '-'
            const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
            const mins = String(Math.abs(offset) % 60).padStart(2, '0')
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hour = String(date.getHours()).padStart(2, '0')
            const minute = String(date.getMinutes()).padStart(2, '0')
            const second = String(date.getSeconds()).padStart(2, '0')
            return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${hours}:${mins}`
        }

        return {
            summary: `🎯 ${habit.title}`,
            description: `${habit.title} - Habit Tracker App`,
            start: {
                dateTime: formatRFC3339(startDateFull),
                timeZone
            },
            end: {
                dateTime: formatRFC3339(endDate),
                timeZone
            },
            recurrence: recurrence.length > 0 ? recurrence : undefined,
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 10 },
                    { method: 'popup', minutes: 0 }
                ]
            },
            colorId: '10'
        }
    } else {
        // All-day event - CRITICAL: end.date must be EXCLUSIVE (next day)
        const startDate = getNextOccurrenceDate(habit)
        const startDateStr = startDate.toISOString().split('T')[0]

        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
        const endDateStr = endDate.toISOString().split('T')[0]

        return {
            summary: `🎯 ${habit.title}`,
            description: `${habit.title} - Habit Tracker App (All-day)`,
            start: {
                date: startDateStr
            },
            end: {
                date: endDateStr // MUST be next day for all-day events!
            },
            recurrence: recurrence.length > 0 ? recurrence : undefined,
            reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', minutes: 540 }] // 9am
            },
            colorId: '10'
        }
    }
}
