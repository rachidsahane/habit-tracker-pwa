// Habit completion types
export const COMPLETION_TYPES = {
    CHECKBOX: 'checkbox',
    NUMERICAL: 'numerical',
}

// Habit frequency types
export const FREQUENCY_TYPES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    CUSTOM: 'custom',
}

// Day names for week display
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Full day names
export const DAY_NAMES_FULL = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
]

// Firestore collection names
export const COLLECTIONS = {
    USERS: 'users',
    HABITS: 'habits',
    COMPLETIONS: 'completions',
    WEEKLY_STATS: 'weeklyStats',
}

// Local storage keys
export const STORAGE_KEYS = {
    THEME: 'theme',
    AUTH: 'auth-storage',
    HABITS: 'habits-storage',
}

// Routes
export const ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    NEW_HABIT: '/new-habit',
    HABIT_DETAILS: '/habit/:habitId',
    LEADERBOARD: '/leaderboard',
    FEED: '/feed',
    SETTINGS: '/settings',
}
