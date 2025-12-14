import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth, db } from './firebase'
import { doc, updateDoc } from 'firebase/firestore'

const CALENDAR_TOKEN_KEY = 'gcal_token'
const TOKEN_EXPIRY_MS = 50 * 60 * 1000 // 50 minutes

function createEventBody(habit) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // RRULE Generation using OBJECT mapping (critical fix!)
    let recurrence = []
    if (habit.frequency === 'daily') {
        recurrence = ['RRULE:FREQ=DAILY']
    } else if (habit.frequency === 'weekly') {
        recurrence = ['RRULE:FREQ=WEEKLY']
    } else if (habit.frequency === 'custom' && habit.customDays?.length > 0) {
        // customDays contains JS day numbers: 0=Sunday, 1=Monday, etc.
        const dayMap = {
            0: 'SU',
            1: 'MO',
            2: 'TU',
            3: 'WE',
            4: 'TH',
            5: 'FR',
            6: 'SA'
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
    console.log(`[Calendar] "${habit.title}": reminderTime=${habit.reminderTime}, hasTime=${hasTime}`)

    if (hasTime) {
        // Timed event (1 hour)
        const today = new Date().toISOString().split('T')[0]
        const startDateTime = `${today}T${habit.reminderTime}:00`
        const startDate = new Date(startDateTime)
        const endDate = new Date(startDate.getTime() + 60 * 60000)

        return {
            summary: `🎯 ${habit.title}`,
            description: `${habit.title} - Habit Tracker App`,
            start: { dateTime: startDate.toISOString(), timeZone },
            end: { dateTime: endDate.toISOString(), timeZone },
            recurrence: recurrence.length > 0 ? recurrence : undefined,
            reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', minutes: 10 }]
            },
            colorId: '10'
        }
    } else {
        // All-day event
        const today = new Date().toISOString().split('T')[0]

        return {
            summary: `🎯 ${habit.title}`,
            description: `${habit.title} - Habit Tracker App (All-day)`,
            start: { date: today },
            end: { date: today },
            recurrence: recurrence.length > 0 ? recurrence : undefined,
            reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', minutes: 540 }]
            },
            colorId: '10'
        }
    }
}

console.log('✅ Calendar service fixed version loaded')
export { createEventBody }
