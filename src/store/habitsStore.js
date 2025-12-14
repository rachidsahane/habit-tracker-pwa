import { create } from 'zustand'
import * as habitsService from '../services/habits'
import * as completionsService from '../services/completions'
import { updateWeeklyStats } from '../services/leaderboard'
import { calculateStreak } from '../utils/streakCalculator'
import { getWeekRange, formatDate } from '../utils/dateUtils'
import { autoSyncHabit, deleteCalendarEvent } from '../services/calendar'

// Note: We don't persist habits locally anymore - Firebase is the source of truth
// Local persistence was causing stale/demo data issues on reload
export const useHabitsStore = create((set, get) => ({
    habits: [],
    completions: {}, // { 'YYYY-MM-DD': [{ habitId, value, timestamp }] }
    isLoading: false,
    error: null,

    // Set habits from Firestore
    setHabits: (habits) => set({ habits }),

    // Set loading state
    setLoading: (isLoading) => set({ isLoading }),

    // Set error
    setError: (error) => set({ error }),

    // Add a new habit (Optimistic to prevent UI blocking)
    addHabit: async (userId, habitData) => {
        // Generate temp ID for immediate UI update
        const tempId = 'temp_' + Date.now()
        const newHabit = {
            id: tempId,
            ...habitData,
            userId,
            currentStreak: 0,
            createdAt: new Date(), // Local date object
            updatedAt: new Date(),
            isTemp: true
        }

        // Update local state immediately
        set((state) => ({
            habits: [newHabit, ...state.habits],
            isLoading: false // Ensure loading is off so UI can update
        }))

        // Sync to Firestore in background
        habitsService.createHabit(userId, habitData)
            .then((serverHabit) => {
                // Replace temp habit with server habit
                set((state) => ({
                    habits: state.habits.map(h =>
                        h.id === tempId ? serverHabit : h
                    )
                }))
                // Auto-sync to calendar if token available
                autoSyncHabit(serverHabit, userId).then(synced => {
                    if (!synced) {
                        // Token expired, suggest re-sync
                        set({ needsCalendarReauth: true })
                    }
                })
            })
            .catch((error) => {
                console.error('Background create failed:', error)
                set((state) => ({
                    error: "Failed to sync new habit. It may disappear on reload.",
                    // Optionally remove the temp habit or keep it with an error flag
                    habits: state.habits.map(h =>
                        h.id === tempId ? { ...h, syncError: true } : h
                    )
                }))
            })

        return newHabit
    },

    // Update a habit (in Firestore)
    updateHabit: async (habitId, updates) => {
        const userId = get().habits.find(h => h.id === habitId)?.userId
        // Optimistic update
        set((state) => ({
            habits: state.habits.map((h) =>
                h.id === habitId ? { ...h, ...updates } : h
            ),
        }))

        try {
            await habitsService.updateHabit(habitId, updates)
            // Auto-sync to calendar if token available
            const updatedHabit = get().habits.find(h => h.id === habitId)
            if (updatedHabit && userId) {
                autoSyncHabit(updatedHabit, userId)
            }
        } catch (error) {
            console.error('Error in updateHabit:', error)
            set({ error: error.message })
            // We could revert here, but for now we keep local changes
        }
    },

    // Delete a habit (from Firestore)
    deleteHabit: async (habitId) => {
        // Store the googleEventId before deleting the habit
        const googleEventId = get().habits.find(h => h.id === habitId)?.googleEventId

        set((state) => ({
            habits: state.habits.filter((h) => h.id !== habitId),
        }))

        try {
            await habitsService.deleteHabit(habitId)
            // Delete from calendar if it was synced
            if (googleEventId) {
                deleteCalendarEvent(googleEventId)
            }
        } catch (error) {
            console.error('Error in deleteHabit:', error)
        }
    },

    // Load habits from Firestore
    loadHabits: async (userId) => {
        set({ isLoading: true, error: null })
        try {
            const habits = await habitsService.getUserHabits(userId)

            set({ habits, isLoading: false })
            return habits
        } catch (error) {
            console.error('Error in loadHabits:', error)
            set({ error: error.message, isLoading: false, habits: [] })
            throw error
        }
    },

    // Verified Streak Check (Callable from UI)
    checkStreaks: async (userId) => {
        const { habits } = get()
        if (habits.length === 0) return

        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = formatDate(yesterday)

        // Fetch completions for yesterday to verify streaks
        let completionsMap = {}
        try {
            const yesterdayCompletions = await completionsService.getCompletionsForDate(userId, yesterdayStr)
            yesterdayCompletions.forEach(c => {
                completionsMap[c.habitId] = c
            })
        } catch (e) {
            console.warn("Failed to fetch yesterday's completions for streak check", e)
            return
        }

        habits.forEach(h => {
            if (h.currentStreak > 0) {
                let shouldReset = false

                // DAILY CHECK
                if (h.frequency === 'daily') {
                    // Check if completed yesterday
                    const completedYesterday = completionsMap[h.id]

                    let achievedYesterday = false
                    if (completedYesterday) {
                        if (h.completionType === 'numerical') {
                            achievedYesterday = (completedYesterday.value || 0) >= (h.targetValue || 1)
                        } else {
                            achievedYesterday = true
                        }
                    }

                    if (!achievedYesterday) {
                        shouldReset = true
                    }
                }

                // ONE-TIME CHECK (Should be 0 always)
                if (h.frequency === 'one-time') {
                    shouldReset = true
                }

                if (shouldReset) {
                    console.log(`Resetting streak for habit ${h.title} (Missed yesterday)`)
                    // Optimistic update
                    set((state) => ({
                        habits: state.habits.map(curr => curr.id === h.id ? { ...curr, currentStreak: 0 } : curr)
                    }))
                    // Background update
                    habitsService.updateHabit(h.id, { currentStreak: 0 }).catch(console.error)
                }
            }
        })
    },

    // Subscribe to real-time habit updates
    subscribeToHabits: (userId) => {
        // Only set loading if we don't have habits yet to avoid flashing
        if (get().habits.length === 0) {
            set({ isLoading: true })
        }

        return habitsService.subscribeToHabits(userId, (habits) => {
            set({ habits, isLoading: false })
        })
    },

    // Set completions for a date
    setCompletions: (date, completions) =>
        set((state) => ({
            completions: {
                ...state.completions,
                [date]: completions,
            },
        })),

    // Load completions for a date range (Weekly)
    loadCompletionsForWeek: async (userId) => {
        try {
            // Get range for current week
            const { start, end } = getWeekRange(new Date())
            // Ensure we include the full day for end date
            const endDateStr = formatDate(end)
            const startDateStr = formatDate(start)

            const completions = await completionsService.getCompletionsForRange(userId, startDateStr, endDateStr)

            // Group by date
            const completionsByDate = {}
            // Initialize empty arrays for all days in range to avoid undefined later? No need, '|| []' handles it.

            completions.forEach(c => {
                if (!completionsByDate[c.date]) completionsByDate[c.date] = []
                completionsByDate[c.date].push(c)
            })

            // Merge with existing state
            set((state) => ({
                completions: {
                    ...state.completions,
                    ...completionsByDate
                }
            }))
            return completionsByDate
        } catch (error) {
            console.error('Error loading completions:', error)
            return {}
        }
    },

    // Kept for backward compatibility if needed, but App.jsx uses week load now
    loadCompletionsForDate: async (userId, date) => {
        try {
            const completions = await completionsService.getCompletionsForDate(userId, date)
            set((state) => ({
                completions: {
                    ...state.completions,
                    [date]: completions,
                },
            }))
            return completions
        } catch (error) {
            console.error('Error loading completions:', error)
            return []
        }
    },

    // Toggle habit completion (Optimistic & Local-First)
    toggleCompletion: async (habitId, userId, date) => {
        const { completions, habits } = get()
        const dateCompletions = completions[date] || []
        const habit = habits.find((h) => h.id === habitId)

        // Block future updates
        const todayStr = formatDate(new Date())
        if (date > todayStr) {
            console.warn("Cannot mark future habits as done")
            return
        }

        // Block past updates (Strict Mode)
        if (date < todayStr) {
            console.warn("Cannot modify past habits")
            return
        }

        // 1. Determine new state (Optimistic)
        const existingCompletion = dateCompletions.find(c => c.habitId === habitId)
        const isCompleting = !existingCompletion

        let newCompletions
        if (isCompleting) {
            // Add optimistic completion
            newCompletions = [...dateCompletions, { habitId, userId, date, value: true, isOptimistic: true }]
        } else {
            // Remove completion
            newCompletions = dateCompletions.filter((c) => c.habitId !== habitId)
        }

        // 2. Update local state immediately
        set((state) => ({
            completions: {
                ...state.completions,
                [date]: newCompletions,
            },
        }))

        // 3. Calculate streak locally (Heuristic for UI responsiveness)
        if (habit) {
            let newStreak = habit.currentStreak

            if (isCompleting) {
                // If we are marking as done, assume we are extending the streak or starting new
                // Simplified heuristic: Just increment. 
                newStreak = (habit.currentStreak || 0) + 1
            } else {
                // If undoing, decrement, but don't go below 0
                newStreak = Math.max(0, (habit.currentStreak || 0) - 1)
            }

            // Update local habit streak immediately
            set((state) => ({
                habits: state.habits.map((h) =>
                    h.id === habitId ? { ...h, currentStreak: newStreak, lastCompletedDate: isCompleting ? date : h.lastCompletedDate } : h
                ),
            }))

            // Sync streak to Firestore in background (Source of Truth for now = Client Heuristic)
            // We persist the heuristic value directly to avoid "bouncing" to 0 caused by missing history
            habitsService.updateHabit(habitId, {
                currentStreak: newStreak,
                lastCompletedDate: isCompleting ? date : (habit.lastCompletedDate || null)
            }).catch(err =>
                console.error('Background streak update failed:', err)
            )
        }

        // 4. Update weekly stats for leaderboard (Aggregate Full Week)
        try {
            const { start, end } = getWeekRange(new Date())
            let totalScheduled = 0
            let totalCompleted = 0
            const current = new Date(start)

            // Loop through each day of the week to calculate REAL percentage
            // We use the updated 'completions' state which now includes the change for 'date'
            const currentCompletionsState = get().completions

            while (current <= end) {
                const currentDateStr = formatDate(current)

                const daysHabits = get().getTodaysHabits(current) // Logic respects frequency
                totalScheduled += daysHabits.length

                const dayCompletions = currentCompletionsState[currentDateStr] || []
                totalCompleted += dayCompletions.length

                current.setDate(current.getDate() + 1)
            }

            // Sync to Firestore in background
            updateWeeklyStats(userId, totalScheduled, totalCompleted).catch(err =>
                console.error('Background leaderboard update failed:', err)
            )
        } catch (statsError) {
            console.error('Error updating weekly stats:', statsError)
        }

        // 5. Sync completion to Firestore
        try {
            await completionsService.toggleCompletion(habitId, userId, date, isCompleting)
        } catch (error) {
            console.error('Error toggling completion in Firestore:', error)
            // Revert on error (optional, but good practice)
            throw error
        }
    },

    // Update habit progress (Numerical)
    updateHabitProgress: async (habitId, userId, date, newValue) => {
        const { completions, habits } = get()
        const dateCompletions = completions[date] || []
        const habit = habits.find((h) => h.id === habitId)

        // Block future updates
        const todayStr = formatDate(new Date())
        if (date > todayStr) return

        // Block past updates (Strict Mode)
        if (date < todayStr) {
            console.warn("Cannot modify past habits")
            return
        }

        // 1. Determine new state (Optimistic)
        const existingCompletion = dateCompletions.find(c => c.habitId === habitId)
        const wasCompleted = existingCompletion && (existingCompletion.value || 0) >= (habit.targetValue || 1)
        const isNowCompleted = newValue >= (habit.targetValue || 1)

        let newCompletions
        if (newValue > 0) {
            if (existingCompletion) {
                // Update existing
                newCompletions = dateCompletions.map(c =>
                    c.habitId === habitId ? { ...c, value: newValue } : c
                )
            } else {
                // Add new
                newCompletions = [...dateCompletions, { habitId, userId, date, value: newValue, isOptimistic: true }]
            }
        } else {
            // Remove if <= 0
            newCompletions = dateCompletions.filter((c) => c.habitId !== habitId)
        }

        // 2. Update local state immediately
        set((state) => ({
            completions: {
                ...state.completions,
                [date]: newCompletions,
            },
        }))

        // 3. Update Streak if completion status changed
        if (habit && wasCompleted !== isNowCompleted) {
            let newStreak = habit.currentStreak || 0

            if (isNowCompleted) {
                // Completed
                newStreak = newStreak + 1
            } else {
                // Uncompleted
                newStreak = Math.max(0, newStreak - 1)
            }

            // Update local habit streak immediately
            set((state) => ({
                habits: state.habits.map((h) =>
                    h.id === habitId ? { ...h, currentStreak: newStreak, lastCompletedDate: isNowCompleted ? date : h.lastCompletedDate } : h
                ),
            }))

            // Sync streak to Firestore
            habitsService.updateHabit(habitId, {
                currentStreak: newStreak,
                lastCompletedDate: isNowCompleted ? date : (habit.lastCompletedDate || null)
            }).catch(err =>
                console.error('Background streak update failed:', err)
            )
        }

        // 4. Sync to Firestore
        try {
            await completionsService.updateCompletionValue(habitId, userId, date, newValue)
        } catch (error) {
            console.error('Error updating progress:', error)
        }
    },

    // Check if habit is completed for a date
    isHabitCompleted: (habitId, date) => {
        const { completions, habits } = get()
        const dateCompletions = completions[date] || []
        const completion = dateCompletions.find((c) => c.habitId === habitId)
        const habit = habits.find(h => h.id === habitId)

        if (!completion) return false

        // For numerical habits, check if value >= target
        if (habit?.completionType === 'numerical' && habit.targetValue) {
            return (completion.value || 0) >= habit.targetValue
        }

        return true
    },

    // Get completion value (for numerical)
    getHabitValue: (habitId, date) => {
        const { completions } = get()
        const dateCompletions = completions[date] || []
        const completion = dateCompletions.find((c) => c.habitId === habitId)
        return completion?.value || 0
    },

    // Get today's habits based on frequency and custom days
    getTodaysHabits: (selectedDate = null) => {
        const { habits } = get()
        const targetDate = selectedDate ? new Date(selectedDate) : new Date()
        const dayOfWeek = targetDate.getDay() // 0 = Sunday, 6 = Saturday

        return habits.filter((habit) => {
            if (habit.frequency === 'daily') return true
            if (habit.frequency === 'custom' && habit.customDays) {
                // customDays is an array of day numbers (0-6)
                return habit.customDays.includes(dayOfWeek)
            }
            if (habit.frequency === 'one-time') {
                const checkDateStr = formatDate(targetDate)
                return habit.targetDate === checkDateStr
            }
            if (habit.frequency === 'weekly') {
                // Weekly habits show on the day they were created
                const createdDate = habit.createdAt?.toDate?.() || new Date(habit.createdAt)
                return createdDate.getDay() === dayOfWeek
            }
            return false
        })
    },

    // Get completion stats for a date
    getStatsForDate: (date) => {
        const { completions, habits } = get()
        const todaysHabits = get().getTodaysHabits(date)
        const dateStr = typeof date === 'string' ? date : formatDate(date)
        const dateCompletions = completions[dateStr] || []

        // Filter based on habit type & targets
        const completedCount = todaysHabits.reduce((acc, habit) => {
            const completion = dateCompletions.find(c => c.habitId === habit.id)
            if (!completion) return acc

            if (habit.completionType === 'numerical' && habit.targetValue) {
                if ((completion.value || 0) >= habit.targetValue) return acc + 1
            } else {
                // Checkbox habit - presence means completed
                return acc + 1
            }
            return acc
        }, 0)

        const total = todaysHabits.length
        const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0

        return { completed: completedCount, total, percentage }
    },

    // Clear all data (for logout)
    clearAll: () => set({ habits: [], completions: {}, isLoading: false, error: null }),
}))
