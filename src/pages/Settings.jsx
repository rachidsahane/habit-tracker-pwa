import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import { useHabitsStore } from '../store/habitsStore'
import { updateUserSettings } from '../services/users'
import BottomNav from '../components/common/BottomNav'
import Button from '../components/common/Button'
import Toggle from '../components/common/Toggle'
import { requestPermission } from '../services/notifications'

export default function Settings() {
    const navigate = useNavigate()
    const { user, clearUser } = useAuthStore()
    const { habits, clearAll } = useHabitsStore()
    const [darkMode, setDarkMode] = useState(
        document.documentElement.classList.contains('dark')
    )
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    // Notifications State
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        const params = JSON.parse(localStorage.getItem('habitParams')) || {}
        return params.notificationsEnabled || false
    })
    const [reminderTime, setReminderTime] = useState(() => {
        const params = JSON.parse(localStorage.getItem('habitParams')) || {}
        return params.reminderTime || '09:00'
    })

    const saveSettings = async (newSettings) => {
        const current = JSON.parse(localStorage.getItem('habitParams')) || {}
        const updated = { ...current, ...newSettings }

        // 1. Save locally
        localStorage.setItem('habitParams', JSON.stringify(updated))

        // 2. Sync to Firestore (if logged in)
        if (user?.uid) {
            try {
                await updateUserSettings(user.uid, { settings: updated })
            } catch (err) {
                console.error("Failed to sync settings to cloud:", err)
            }
        }
    }

    const handleToggleDarkMode = (enabled) => {
        setDarkMode(enabled)
        if (enabled) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }

    const handleToggleNotifications = async (enabled) => {
        if (enabled) {
            const granted = await requestPermission()
            if (granted) {
                setNotificationsEnabled(true)
                saveSettings({ notificationsEnabled: true })
            } else {
                setNotificationsEnabled(false)
                alert('Notification permission denied. Please enable it in your browser settings.')
            }
        } else {
            setNotificationsEnabled(false)
            saveSettings({ notificationsEnabled: false })
        }
    }

    const handleReminderTimeChange = (e) => {
        const time = e.target.value
        setReminderTime(time)
        saveSettings({ reminderTime: time })
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await signOut()
            clearUser()
            clearAll()
            navigate('/')
        } catch (error) {
            console.error('Logout error:', error)
            alert('Failed to sign out. Please try again.')
        } finally {
            setIsLoggingOut(false)
        }
    }

    const stats = {
        totalHabits: habits.length,
        publicHabits: habits.filter((h) => h.isPublic).length,
        privateHabits: habits.filter((h) => !h.isPublic).length,
        totalStreak: habits.reduce((acc, h) => acc + (h.currentStreak || 0), 0),
    }

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display">
            <div className="flex-grow pb-28">
                {/* Header */}
                <header className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 sticky top-0 z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex size-12 shrink-0 items-center justify-start text-text-light-primary dark:text-text-dark-primary"
                    >
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </button>
                    <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-text-light-primary dark:text-text-dark-primary">
                        Settings
                    </h1>
                    <div className="w-12" />
                </header>

                <main className="p-4 flex flex-col gap-6">
                    {/* Profile Section */}
                    <section className="bg-content-light dark:bg-content-dark rounded-xl p-4">
                        <div className="flex items-center gap-4">
                            {user?.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    className="w-16 h-16 rounded-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-3xl">
                                        person
                                    </span>
                                </div>
                            )}
                            <div>
                                <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                                    {user?.displayName || 'User'}
                                </h2>
                                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Stats Section */}
                    <section className="bg-content-light dark:bg-content-dark rounded-xl p-4">
                        <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary uppercase mb-4">
                            Your Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                                <p className="text-2xl font-bold text-primary">
                                    {stats.totalHabits}
                                </p>
                                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                    Total Habits
                                </p>
                            </div>
                            <div className="text-center p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                                <p className="text-2xl font-bold text-primary">
                                    🔥 {stats.totalStreak}
                                </p>
                                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                    Total Streak Days
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-primary">
                                    {stats.publicHabits}
                                </p>
                                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                    Public
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-primary">
                                    {stats.privateHabits}
                                </p>
                                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                    Private
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Preferences */}
                    <section className="bg-content-light dark:bg-content-dark rounded-xl p-4">
                        <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary uppercase mb-4">
                            Preferences
                        </h3>
                        <Toggle
                            label="Dark Mode"
                            checked={darkMode}
                            onChange={handleToggleDarkMode}
                        />

                        <div className="my-4 h-px bg-border-light dark:bg-border-dark/50" />

                        <div className="flex flex-col gap-4">
                            <Toggle
                                label="Daily Reminders"
                                checked={notificationsEnabled}
                                onChange={handleToggleNotifications}
                            />

                            {notificationsEnabled && (
                                <div className="flex items-center justify-between animation-slide-down">
                                    <span className="text-text-light-primary dark:text-text-dark-primary">
                                        Reminder Time
                                    </span>
                                    <input
                                        type="time"
                                        value={reminderTime}
                                        onChange={handleReminderTimeChange}
                                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg p-2 text-text-light-primary dark:text-white focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* App Info */}
                    <section className="bg-content-light dark:bg-content-dark rounded-xl p-4">
                        <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary uppercase mb-4">
                            About
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-text-light-primary dark:text-text-dark-primary">
                                    Version
                                </span>
                                <span className="text-text-light-secondary dark:text-text-dark-secondary">
                                    1.5.4
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-light-primary dark:text-text-dark-primary">
                                    Build
                                </span>
                                <span className="text-text-light-secondary dark:text-text-dark-secondary">
                                    PWA
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Logout */}
                    <Button
                        fullWidth
                        variant="danger"
                        onClick={handleLogout}
                        isLoading={isLoggingOut}
                        icon="logout"
                    >
                        Sign Out
                    </Button>
                </main>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    )
}
