import { create } from 'zustand'
import * as habitsService from '../services/habits'
import * as completionsService from '../services/completions'
import { updateWeeklyStats } from '../services/leaderboard'

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

    // Add a new habit (to Firestore)
    addHabit: async (userId, habitData) => {
        set({ isLoading: true, error: null })
        try {
            const newHabit = await habitsService.createHabit(userId, habitData)
            set((state) => ({
                habits: [newHabit, ...state.habits],
                isLoading: false,
            }))
            return newHabit
        } catch (error) {
            console.error('Error in addHabit:', error)
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    // Update a habit (in Firestore)
    updateHabit: async (habitId, updates) => {
        set({ isLoading: true, error: null })
        try {
            await habitsService.updateHabit(habitId, updates)
            set((state) => ({
                habits: state.habits.map((h) =>
                    h.id === habitId ? { ...h, ...updates } : h
                ),
                isLoading: false,
            }))
        } catch (error) {
            console.error('Error in updateHabit:', error)
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    // Delete a habit (from Firestore)
    deleteHabit: async (habitId) => {
        set({ isLoading: true, error: null })
        try {
            await habitsService.deleteHabit(habitId)
            set((state) => ({
                habits: state.habits.filter((h) => h.id !== habitId),
                isLoading: false,
            }))
        } catch (error) {
            console.error('Error in deleteHabit:', error)
            set({ error: error.message, isLoading: false })
            throw error
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

    // Subscribe to real-time habit updates
    subscribeToHabits: (userId) => {
        return habitsService.subscribeToHabits(userId, (habits) => {
            set({ habits })
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

    // Load completions for a date from Firestore
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

    // Toggle habit completion (in Firestore)
    toggleCompletion: async (habitId, userId, date) => {
        try {
            const result = await completionsService.toggleCompletion(habitId, userId, date)
            const { completions, habits } = get()
            const dateCompletions = completions[date] || []

            let newCompletions
            if (result) {
                // Completion was added
                newCompletions = [...dateCompletions, result]
            } else {
                // Completion was removed
                newCompletions = dateCompletions.filter((c) => c.habitId !== habitId)
            }

            // Update local state
            set((state) => ({
                completions: {
                    ...state.completions,
                    [date]: newCompletions,
                },
            }))

            // Recalculate streak
            const habit = habits.find((h) => h.id === habitId)
            if (habit) {
                try {
                    const newStreak = await completionsService.calculateStreak(habitId, userId, habit)
                    await habitsService.updateHabit(habitId, { currentStreak: newStreak })
                    set((state) => ({
                        habits: state.habits.map((h) =>
                            h.id === habitId ? { ...h, currentStreak: newStreak } : h
                        ),
                    }))
                } catch (streakError) {
                    console.error('Error updating streak:', streakError)
                }
            }

            // Update weekly stats for leaderboard
            try {
                const todaysHabits = get().getTodaysHabits()
                const today = new Date().toISOString().split('T')[0]
                const todayCompletions = get().completions[today] || []
                await updateWeeklyStats(userId, todaysHabits.length, todayCompletions.length)
            } catch (statsError) {
                console.error('Error updating weekly stats:', statsError)
            }

            return result
        } catch (error) {
            console.error('Error toggling completion:', error)
            throw error
        }
    },

    // Check if habit is completed for a date
    isHabitCompleted: (habitId, date) => {
        const { completions } = get()
        const dateCompletions = completions[date] || []
        return dateCompletions.some((c) => c.habitId === habitId)
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
            if (habit.frequency === 'weekly') {
                // Weekly habits show on the day they were created
                const createdDate = habit.createdAt?.toDate?.() || new Date(habit.createdAt)
                return createdDate.getDay() === dayOfWeek
            }
            return true
        })
    },

    // Get completion stats for a date
    getStatsForDate: (date) => {
        const { completions } = get()
        const todaysHabits = get().getTodaysHabits(date)
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
        const dateCompletions = completions[dateStr] || []

        const completed = dateCompletions.length
        const total = todaysHabits.length
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

        return { completed, total, percentage }
    },

    // Clear all data (for logout)
    clearAll: () => set({ habits: [], completions: {}, isLoading: false, error: null }),
}))
