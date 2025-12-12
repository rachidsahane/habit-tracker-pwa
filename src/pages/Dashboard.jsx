import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useHabitsStore } from '../store/habitsStore'
import BottomNav from '../components/common/BottomNav'
import WeekCalendar from '../components/dashboard/WeekCalendar'
import HabitCard from '../components/habits/HabitCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatDate } from '../utils/dateUtils'

export default function Dashboard() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const {
        habits,
        completions,
        isLoading,
        getTodaysHabits,
        getStatsForDate,
        isHabitCompleted,
        toggleCompletion,
        updateHabitProgress,
        getHabitValue,
        loadCompletionsForDate,
        subscribeToHabits,
        checkStreaks // New action
    } = useHabitsStore()

    const [selectedDate, setSelectedDate] = useState(new Date())

    const today = new Date()
    const todayStr = formatDate(today)
    const selectedDateStr = formatDate(selectedDate)
    const isToday = selectedDateStr === todayStr
    const isFuture = selectedDateStr > todayStr
    const isPast = selectedDateStr < todayStr

    const habitsForSelectedDay = getTodaysHabits(selectedDate)
    const { completed, total, percentage } = getStatsForDate(selectedDateStr)

    // Load completions when date changes
    useEffect(() => {
        if (user?.uid) {
            loadCompletionsForDate(user.uid, selectedDateStr)
        }
    }, [selectedDateStr, user?.uid, loadCompletionsForDate])

    // Subscribe to habits (Real-time & Offline)
    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = subscribeToHabits(user.uid)
            return () => unsubscribe()
        }
    }, [user?.uid, subscribeToHabits])

    // Run deep streak check once habits are loaded
    useEffect(() => {
        if (user?.uid && habits.length > 0) {
            checkStreaks(user.uid)
        }
    }, [user?.uid, habits.length > 0]) // Simple dependency to retry if habits load later

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 18) return 'Good Afternoon'
        return 'Good Evening'
    }

    const firstName = user?.displayName?.split(' ')[0] || 'there'

    const handleToggleCompletion = async (habitId) => {
        if (!user?.uid) return
        try {
            await toggleCompletion(habitId, user.uid, selectedDateStr)
        } catch (error) {
            console.error('Error toggling completion:', error)
        }
    }

    const handleUpdateProgress = async (habitId, newValue) => {
        if (!user?.uid) return
        try {
            await updateHabitProgress(habitId, user.uid, selectedDateStr, newValue)
        } catch (error) {
            console.error('Error updating progress:', error)
        }
    }

    const handleDateSelect = (date) => {
        setSelectedDate(date)
    }

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
            <div className="flex-grow pb-40">
                {/* Desktop Header/Hero Section */}
                <div className="md:min-h-[50vh] md:flex md:flex-col md:justify-center md:bg-gray-50/50 md:dark:bg-gray-900/50">
                    {/* Header */}
                    <div className="flex items-center bg-background-light dark:bg-background-dark md:bg-transparent p-4 pb-2 justify-between sticky top-0 z-10 md:static">
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center">
                                {user?.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt="Profile"
                                        className="rounded-full size-10 object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="rounded-full size-10 bg-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">
                                            person
                                        </span>
                                    </div>
                                )}
                            </div>
                            <h2 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold leading-tight tracking-[-0.015em] flex-1">
                                {getGreeting()}, {firstName}!
                            </h2>
                        </div>
                        <div className="flex w-12 items-center justify-end">
                            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-text-light-primary dark:text-text-dark-primary gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0">
                                <span className="material-symbols-outlined">calendar_today</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Section */}
                    <div className="flex flex-col gap-3 p-4">
                        <div className="flex gap-6 justify-between items-center">
                            <p className="text-text-light-primary dark:text-text-dark-primary text-base font-medium leading-normal">
                                {isToday ? "You've completed" : "Completed"} {completed} of {total} habits{isToday ? " today" : ""}!
                            </p>
                            <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-normal leading-normal">
                                {percentage}%
                            </p>
                        </div>
                        <div className="rounded-full bg-border-light dark:bg-border-dark/50">
                            <div
                                className="h-2 rounded-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-normal leading-normal">
                            {percentage >= 100
                                ? '🎉 All done!'
                                : percentage > 0
                                    ? 'Keep it up!'
                                    : total === 0
                                        ? 'No habits scheduled'
                                        : 'Start completing your habits!'}
                        </p>
                    </div>

                    {/* Week Calendar */}
                    <WeekCalendar
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        completionsByDate={completions}
                    />
                </div>

                {/* Today's Habits Section */}
                <h3 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-2">
                    {isToday ? "Today's Habits" : `Habits for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}`}
                </h3>

                <div className="px-4 flex flex-col gap-2">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : habitsForSelectedDay.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2 block">
                                checklist
                            </span>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {habits.length === 0
                                    ? 'No habits yet'
                                    : 'No habits scheduled for this day'}
                            </p>
                            {habits.length === 0 && (
                                <button
                                    onClick={() => navigate('/new-habit')}
                                    className="text-primary font-medium hover:underline"
                                >
                                    Create your first habit
                                </button>
                            )}
                        </div>
                    ) : (
                        habitsForSelectedDay.map((habit) => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                isCompleted={isHabitCompleted(habit.id, selectedDateStr)}
                                currentValue={getHabitValue(habit.id, selectedDateStr)}
                                onToggle={handleToggleCompletion}
                                onUpdateProgress={handleUpdateProgress}
                                disabled={isFuture || isPast}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* FAB - Add Habit */}
            <div className="fixed bottom-24 right-4 z-20">
                <button
                    onClick={() => navigate('/new-habit')}
                    className="flex items-center justify-center size-14 cursor-pointer overflow-hidden rounded-full bg-primary text-text-light-primary shadow-lg hover:shadow-xl transition-shadow animate-pulse-glow"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    )
}
