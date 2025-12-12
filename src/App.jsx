import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useHabitsStore } from './store/habitsStore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/firebase'
import { checkDailyReminder } from './services/notifications'
import { getUserProfile } from './services/users'

// Pages
import Welcome from './pages/Welcome'
import Dashboard from './pages/Dashboard'
import NewHabit from './pages/NewHabit'
import EditHabit from './pages/EditHabit'
import HabitDetails from './pages/HabitDetails'
import Leaderboard from './pages/Leaderboard'
import UserProfile from './pages/UserProfile'
import ProgressFeed from './pages/ProgressFeed'
import Settings from './pages/Settings'

// Components
import LoadingSpinner from './components/common/LoadingSpinner'

// Protected Route wrapper
function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuthStore()

    // Check for notifications
    useEffect(() => {
        try {
            checkDailyReminder()
        } catch (e) {
            console.error("Notification check failed", e)
        }

        // check every minute
        const interval = setInterval(() => {
            try {
                checkDailyReminder()
            } catch (e) {
                console.error("Notification interval failed", e)
            }
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return children
}

function App() {
    const { user, setUser, setLoading } = useAuthStore()
    const { loadHabits, loadCompletionsForDate, subscribeToHabits, clearAll } = useHabitsStore()

    useEffect(() => {
        let unsubscribeHabits = null

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in
                setUser({
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    email: firebaseUser.email,
                    photoURL: firebaseUser.photoURL,
                })

                // Load user's habits from Firestore
                try {
                    // Load User Settings (sync to local)
                    const profile = await getUserProfile(firebaseUser.uid)
                    if (profile?.settings) {
                        localStorage.setItem('habitParams', JSON.stringify(profile.settings))
                    }

                    // We rely on subscribeToHabits for habits data (real-time & offline cache)
                    // But we need to load completions for the whole week for the leaderboard logic
                    const { loadCompletionsForWeek, subscribeToHabits } = useHabitsStore.getState() // Access latest state if needed, or use destructured

                    await loadCompletionsForWeek(firebaseUser.uid)

                    // Subscribe to real-time habit updates
                    unsubscribeHabits = subscribeToHabits(firebaseUser.uid)
                } catch (error) {
                    console.error('Error loading user data:', error)
                }
            } else {
                // User is signed out
                setUser(null)
                clearAll()

                if (unsubscribeHabits) {
                    unsubscribeHabits()
                    unsubscribeHabits = null
                }
            }
            setLoading(false)
        })

        return () => {
            unsubscribeAuth()
            if (unsubscribeHabits) {
                unsubscribeHabits()
            }
        }
    }, [setUser, setLoading, loadHabits, loadCompletionsForDate, subscribeToHabits, clearAll])

    // Initialize dark mode from localStorage
    useEffect(() => {
        const theme = localStorage.getItem('theme')
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        }
    }, [])

    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
                <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/new-habit"
                        element={
                            <ProtectedRoute>
                                <NewHabit />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/edit-habit/:habitId"
                        element={
                            <ProtectedRoute>
                                <EditHabit />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/habit/:habitId"
                        element={
                            <ProtectedRoute>
                                <HabitDetails />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/leaderboard"
                        element={
                            <ProtectedRoute>
                                <Leaderboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile/:userId"
                        element={
                            <ProtectedRoute>
                                <UserProfile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/feed"
                        element={
                            <ProtectedRoute>
                                <ProgressFeed />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </BrowserRouter>
    )
}

export default App
