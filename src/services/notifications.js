import { useHabitsStore } from '../store/habitsStore'

/**
 * Request notification permission
 */
export async function requestPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

/**
 * Send a notification
 */
export async function sendNotification(title, body, icon = '/pwa-192x192.png') {
    if (Notification.permission === 'granted') {
        try {
            // Try to use Service Worker registration first (Best for Mobile/PWA)
            const registration = await navigator.serviceWorker.ready
            await registration.showNotification(title, {
                body,
                icon,
                badge: '/pwa-192x192.png',
                vibrate: [100, 50, 100],
                tag: title,
                data: { url: '/' } // Payload for click handling
            })
        } catch (e) {
            console.warn("SW notification failed, falling back to constructor", e)
            // Fallback for non-SW environments (e.g. localhost sometimes)
            const notification = new Notification(title, {
                body,
                icon,
                badge: '/pwa-192x192.png',
                vibrate: [100, 50, 100],
                tag: title,
            })
            notification.onclick = function (event) {
                event.preventDefault()
                window.focus()
                notification.close()
            }
        }
    }
}

/**
 * Check if a daily reminder should be sent
 * This is a client-side check that runs when the app is active
 */
export function checkDailyReminder() {
    // 1. Global Daily Reminder
    checkGlobalReminder()

    // 2. Habit Specific Reminders
    checkHabitReminders()
}

function checkGlobalReminder() {
    const settings = JSON.parse(localStorage.getItem('habitParams')) || {}
    const { notificationsEnabled, reminderTime } = settings

    if (!notificationsEnabled || !reminderTime) return

    const now = new Date()
    const lastReminderDate = localStorage.getItem('lastReminderDate')
    const todayStr = now.toDateString()

    // Already reminded today
    if (lastReminderDate === todayStr) return

    // Check time
    const [hours, minutes] = reminderTime.split(':').map(Number)
    const reminderDate = new Date()
    reminderDate.setHours(hours, minutes, 0, 0)

    // Notify if current time is past reminder time (and within reasonable window, e.g., same day)
    if (now >= reminderDate) {
        sendNotification(
            "Time to check your habits!",
            "Don't forget to log your progress for today."
        )
        localStorage.setItem('lastReminderDate', todayStr)
    }
}

function checkHabitReminders() {
    const now = new Date()
    // 10 minutes from now (for window calculation) vs "10 minutes before" logic
    // Logic: If (HabitTime - 10min) <= Now < HabitTime

    // Get store state directly
    const store = useHabitsStore.getState()
    const todaysHabits = store.getTodaysHabits ? store.getTodaysHabits(now) : []

    // Get notified history
    const todayKey = now.toISOString().split('T')[0]
    const notifiedMap = JSON.parse(localStorage.getItem('notifiedHabits')) || {}
    const notifiedToday = notifiedMap[todayKey] || []

    let updatedNotified = [...notifiedToday]
    let changed = false

    todaysHabits.forEach(habit => {
        if (!habit.hasReminder || !habit.reminderTime || habit.isCompleted) return
        if (updatedNotified.includes(habit.id)) return

        const [h, m] = habit.reminderTime.split(':').map(Number)
        const habitTime = new Date()
        habitTime.setHours(h, m, 0, 0)

        // Calculate "Notify Time" = 10 minutes before
        const notifyTime = new Date(habitTime.getTime() - 10 * 60000)

        // Check window:
        // We notify if Now >= NotifyTime AND Now < HabitTime (roughly)
        // This ensures we catch it even if the interval is slightly delayed
        if (now >= notifyTime && now < habitTime) {
            sendNotification(
                `Upcoming Habit: ${habit.title}`,
                `Your habit is scheduled for ${habit.reminderTime}. Get ready!`
            )
            updatedNotified.push(habit.id)
            changed = true
        }
    })

    if (changed) {
        // Clean up old keys if needed, but for now just save today
        localStorage.setItem('notifiedHabits', JSON.stringify({
            ...notifiedMap,
            [todayKey]: updatedNotified
        }))
    }
}
