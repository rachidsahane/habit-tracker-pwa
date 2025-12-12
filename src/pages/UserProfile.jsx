import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserProfile } from '../services/users'
import { getPublicHabitsForUser } from '../services/habits'
import { getUserRank } from '../services/leaderboard'
import HabitCard from '../components/habits/HabitCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import BottomNav from '../components/common/BottomNav'

export default function UserProfile() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [habits, setHabits] = useState([])
    const [stats, setStats] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            if (!userId) return
            setIsLoading(true)
            try {
                const [userProfile, userHabits, userStats] = await Promise.all([
                    getUserProfile(userId),
                    getPublicHabitsForUser(userId),
                    getUserRank(userId)
                ])
                setProfile(userProfile)
                setHabits(userHabits)
                setStats(userStats)
            } catch (error) {
                console.error("Failed to load user profile", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [userId])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <LoadingSpinner />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark text-text-light-primary dark:text-white gap-4">
                <p>User not found</p>
                <button onClick={() => navigate(-1)} className="text-primary hover:underline">Go Back</button>
            </div>
        )
    }

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark pb-24 font-display">
            {/* Header */}
            <header className="flex items-center p-4 sticky top-0 bg-background-light dark:bg-background-dark z-10 transition-shadow">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-12 shrink-0 items-center justify-start text-text-light-primary dark:text-gray-200"
                >
                    <span className="material-symbols-outlined !text-2xl">
                        arrow_back_ios_new
                    </span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-text-light-primary dark:text-gray-200">
                    Profile
                </h1>
                <div className="w-12"></div>
            </header>

            <div className="flex flex-col items-center p-6 gap-4">
                {/* Avatar */}
                <div className="size-24 rounded-full overflow-hidden border-4 border-primary/20">
                    {profile.photoURL ? (
                        <img
                            src={profile.photoURL}
                            alt={profile.displayName}
                            className="size-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="size-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-primary">person</span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="text-center">
                    <h2 className="text-xl font-bold text-text-light-primary dark:text-white">
                        {profile.displayName || 'Anonymous User'}
                    </h2>
                    {stats && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Current Rank: #{stats.rank} • {stats.percentage}% Completion
                        </p>
                    )}
                </div>
            </div>

            {/* Public Habits */}
            <div className="px-4 flex flex-col gap-4 mt-2">
                <h3 className="text-lg font-bold text-text-light-primary dark:text-white">Public Habits</h3>

                {habits.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No public habits shared.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {habits.map(habit => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                isCompleted={false} // Read-only view
                                disabled={true}
                                showCheckbox={false} // Or true but disabled? False is cleaner for profile view.
                            />
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    )
}
