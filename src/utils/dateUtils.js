/**
 * Format a date object to YYYY-MM-DD string
 */
export function formatDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Get ISO week ID for a date (e.g., "2024-W50")
 */
export function getWeekId(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
    const week1 = new Date(d.getFullYear(), 0, 4)
    const weekNumber = Math.ceil(
        ((d.getTime() - week1.getTime()) / 86400000 + week1.getDay() + 1) / 7
    )
    return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

/**
 * Get array of 7 days for the current week (Sunday to Saturday)
 */
export function getWeekDays(date = new Date()) {
    const days = []
    const current = new Date(date)
    const dayOfWeek = current.getDay()

    // Go to start of week (Sunday)
    current.setDate(current.getDate() - dayOfWeek)
    current.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }

    return days
}

/**
 * Check if a date is today
 */
export function isToday(date) {
    const today = new Date()
    const d = new Date(date)
    return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
    )
}

/**
 * Get day of week as number (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date) {
    return new Date(date).getDay()
}

/**
 * Get relative time string (e.g., "2h ago", "3d ago")
 */
export function getRelativeTime(date) {
    const now = new Date()
    const d = new Date(date)
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(date)
}

/**
 * Get start and end of week for a given date
 */
export function getWeekRange(date = new Date()) {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay()) // Sunday
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(end.getDate() + 6) // Saturday
    end.setHours(23, 59, 59, 999)

    return { start, end }
}
