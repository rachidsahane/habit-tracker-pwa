import { formatDate, getDayOfWeek } from './dateUtils'

/**
 * Calculate the current streak for a habit based on completions
 * @param {Array} completions - Array of completion records sorted by date (newest first)
 * @param {Object} habit - The habit object with frequency settings
 * @returns {number} The current streak count
 */
export function calculateStreak(completions, habit) {
    if (!completions || completions.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = 0
    let currentDate = new Date(today)

    // Check if habit should be tracked on a specific day
    const shouldTrackOnDay = (date) => {
        if (habit.frequency === 'daily') return true
        if (habit.frequency === 'custom' && habit.customDays) {
            return habit.customDays.includes(getDayOfWeek(date))
        }
        return true
    }

    // Create a set of completion dates for quick lookup
    const completionDates = new Set(
        completions.map((c) => c.date || formatDate(new Date(c.timestamp)))
    )

    // Go backwards from today counting consecutive completions
    while (true) {
        const dateStr = formatDate(currentDate)

        // Skip days that aren't tracked
        if (!shouldTrackOnDay(currentDate)) {
            currentDate.setDate(currentDate.getDate() - 1)
            continue
        }

        // If today and not completed, check if it's still possible to complete
        if (currentDate.getTime() === today.getTime()) {
            if (!completionDates.has(dateStr)) {
                // Today not completed yet, check yesterday
                currentDate.setDate(currentDate.getDate() - 1)
                continue
            }
        }

        // Check if this day has a completion
        if (completionDates.has(dateStr)) {
            streak++
            currentDate.setDate(currentDate.getDate() - 1)
        } else {
            // Streak broken
            break
        }

        // Safety limit to prevent infinite loops
        if (streak > 1000) break
    }

    return streak
}

/**
 * Get the longest streak from completion history
 */
export function getLongestStreak(completions, habit) {
    if (!completions || completions.length === 0) return 0

    // Sort completions by date
    const sortedCompletions = [...completions].sort(
        (a, b) => new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp)
    )

    let longestStreak = 0
    let currentStreak = 0
    let lastDate = null

    const shouldTrackOnDay = (date) => {
        if (habit.frequency === 'daily') return true
        if (habit.frequency === 'custom' && habit.customDays) {
            return habit.customDays.includes(getDayOfWeek(date))
        }
        return true
    }

    for (const completion of sortedCompletions) {
        const date = new Date(completion.date || completion.timestamp)
        date.setHours(0, 0, 0, 0)

        if (!shouldTrackOnDay(date)) continue

        if (!lastDate) {
            currentStreak = 1
        } else {
            // Check if this is the next consecutive day
            const expectedDate = new Date(lastDate)
            do {
                expectedDate.setDate(expectedDate.getDate() + 1)
            } while (!shouldTrackOnDay(expectedDate))

            if (date.getTime() === expectedDate.getTime()) {
                currentStreak++
            } else {
                longestStreak = Math.max(longestStreak, currentStreak)
                currentStreak = 1
            }
        }

        lastDate = date
    }

    return Math.max(longestStreak, currentStreak)
}
