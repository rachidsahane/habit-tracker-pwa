import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { subscribeToLeaderboard, getUserRank, getLastWeekId, getWeekId } from '../services/leaderboard'
import BottomNav from '../components/common/BottomNav'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function Leaderboard() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [period, setPeriod] = useState('thisWeek')
    const [leaderboard, setLeaderboard] = useState([])
    const [userRank, setUserRank] = useState({ rank: 0, percentage: 0 })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let unsubscribe = () => { }
        setIsLoading(true)

        try {
            const weekId = period === 'thisWeek' ? getWeekId() : getLastWeekId()

            // Subscribe to real-time updates
            unsubscribe = subscribeToLeaderboard(weekId, (data) => {
                setLeaderboard(data)

                if (user?.uid) {
                    // Update user rank locally since we have the full list
                    const userEntry = data.find(u => u.userId === user.uid)
                    if (userEntry) {
                        setUserRank({ rank: userEntry.rank, percentage: userEntry.percentage })
                    } else {
                        // Pending logic: if user not in list (e.g. 0 habits), default to last rank or 0
                        setUserRank({ rank: data.length + 1, percentage: 0 })
                    }
                }
                setIsLoading(false)
            })
        } catch (error) {
            console.error('Error in leaderboard subscription:', error)
            setIsLoading(false)
        }

        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, [period, user?.uid])

    const topThree = leaderboard.slice(0, 3)
    // Display ALL users in the list, as requested by the user
    const listToDisplay = leaderboard

    const getRankBorderColor = (rank) => {
        switch (rank) {
            case 1: return 'border-yellow-400'
            case 2: return 'border-slate-300'
            case 3: return 'border-amber-600'
            default: return 'border-gray-300'
        }
    }

    const getRankBadgeColor = (rank) => {
        switch (rank) {
            case 1: return 'bg-yellow-400 text-yellow-900'
            case 2: return 'bg-slate-300 text-slate-700'
            case 3: return 'bg-amber-600 text-amber-100'
            default: return 'bg-gray-300 text-gray-700'
        }
    }

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-200">
            {/* Header */}
            <div className="flex items-center p-4 pb-2 bg-background-light dark:bg-background-dark sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-12 shrink-0 items-center justify-start"
                >
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em]">
                    Weekly Leaderboard
                </h2>
                <div className="flex w-12 items-center justify-end">
                    <button className="flex h-12 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-transparent min-w-0 p-0 text-base font-bold leading-normal tracking-[0.015em]">
                        <span className="material-symbols-outlined">ios_share</span>
                    </button>
                </div>
            </div>

            {/* Period Toggle */}
            <div className="flex px-4 py-3">
                <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 p-1">
                    <label
                        className={`flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal transition-all ${period === 'thisWeek'
                            ? 'bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        <span className="truncate">This Week</span>
                        <input
                            type="radio"
                            name="time-period"
                            value="thisWeek"
                            checked={period === 'thisWeek'}
                            onChange={() => setPeriod('thisWeek')}
                            className="invisible w-0"
                        />
                    </label>
                    <label
                        className={`flex h-full grow cursor-pointer items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium leading-normal transition-all ${period === 'lastWeek'
                            ? 'bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        <span className="truncate">Last Week</span>
                        <input
                            type="radio"
                            name="time-period"
                            value="lastWeek"
                            checked={period === 'lastWeek'}
                            onChange={() => setPeriod('lastWeek')}
                            className="invisible w-0"
                        />
                    </label>
                </div>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
                    <span className="material-symbols-outlined text-5xl text-gray-400 mb-4">
                        leaderboard
                    </span>
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                        No leaderboard data yet.
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm text-center mt-2">
                        Complete habits to appear on the leaderboard!
                    </p>
                </div>
            ) : (
                <>
                    {/* Podium Section */}
                    <div className="flex items-end justify-center gap-4 px-4 py-6">
                        {/* 2nd Place */}
                        {topThree[1] && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    {topThree[1].photoURL ? (
                                        <img
                                            src={topThree[1].photoURL}
                                            alt={topThree[1].displayName}
                                            className={`aspect-square w-16 rounded-full bg-cover bg-center border-2 ${getRankBorderColor(2)} object-cover`}
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className={`aspect-square w-16 rounded-full border-2 ${getRankBorderColor(2)} bg-primary/20 flex items-center justify-center`}>
                                            <span className="material-symbols-outlined text-primary text-2xl">person</span>
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full ${getRankBadgeColor(2)} text-sm font-bold`}>
                                        2
                                    </div>
                                </div>
                                <p className="text-sm font-bold">{topThree[1].displayName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{topThree[1].percentage}%</p>
                            </div>
                        )}

                        {/* 1st Place */}
                        {topThree[0] && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    {topThree[0].photoURL ? (
                                        <img
                                            src={topThree[0].photoURL}
                                            alt={topThree[0].displayName}
                                            className={`aspect-square w-24 rounded-full bg-cover bg-center border-4 ${getRankBorderColor(1)} object-cover`}
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className={`aspect-square w-24 rounded-full border-4 ${getRankBorderColor(1)} bg-primary/20 flex items-center justify-center`}>
                                            <span className="material-symbols-outlined text-primary text-3xl">person</span>
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full ${getRankBadgeColor(1)} text-base font-bold`}>
                                        1
                                    </div>
                                </div>
                                <p className="text-base font-bold">{topThree[0].displayName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{topThree[0].percentage}%</p>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {topThree[2] && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    {topThree[2].photoURL ? (
                                        <img
                                            src={topThree[2].photoURL}
                                            alt={topThree[2].displayName}
                                            className={`aspect-square w-16 rounded-full bg-cover bg-center border-2 ${getRankBorderColor(3)} object-cover`}
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className={`aspect-square w-16 rounded-full border-2 ${getRankBorderColor(3)} bg-primary/20 flex items-center justify-center`}>
                                            <span className="material-symbols-outlined text-primary text-2xl">person</span>
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full ${getRankBadgeColor(3)} text-sm font-bold`}>
                                        3
                                    </div>
                                </div>
                                <p className="text-sm font-bold">{topThree[2].displayName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{topThree[2].percentage}%</p>
                            </div>
                        )}
                    </div>

                    {/* User's Rank Card */}
                    {user && (
                        <div className="p-4">
                            <div className="flex items-center justify-between gap-4 rounded-xl bg-primary/20 dark:bg-primary/30 p-4 border border-primary">
                                <div className="flex items-center gap-4">
                                    <p className="text-lg font-bold w-6 text-center">{userRank.rank || '-'}</p>
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt="Your avatar"
                                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-primary">person</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <p className="text-base font-bold leading-tight">You</p>
                                        <p className="text-sm font-normal leading-normal text-slate-600 dark:text-slate-300">
                                            {userRank.percentage || 0}% complete
                                        </p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-primary">workspace_premium</span>
                            </div>
                        </div>
                    )}

                    {/* Leaderboard List */}
                    <div className="flex flex-col gap-2 px-4 pb-24">
                        {listToDisplay.map((person) => (
                            <div
                                key={person.id}
                                className={`flex items-center gap-4 rounded-xl p-3 shadow-sm ${person.userId === user?.uid
                                    ? 'bg-primary/10 dark:bg-primary/20 border border-primary/50'
                                    : 'bg-white dark:bg-background-dark'
                                    }`}
                            >
                                <p className="w-6 text-center font-semibold text-slate-500 dark:text-slate-400">{person.rank}</p>
                                {person.photoURL ? (
                                    <img
                                        src={person.photoURL}
                                        alt={person.displayName}
                                        className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <p className="font-bold">{person.displayName}</p>
                                    {/* Progress Bar in List */}
                                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                                        <div
                                            className="h-1.5 rounded-full bg-primary transition-all"
                                            style={{ width: `${person.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <p className="font-bold text-sm">{person.percentage}%</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    )
}
