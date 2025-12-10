export default function StreakBadge({ streak, size = 'md' }) {
    if (!streak || streak === 0) return null

    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    }

    return (
        <span className={`text-text-light-secondary dark:text-text-dark-secondary ${sizeClasses[size]}`}>
            🔥 {streak} {streak === 1 ? 'day' : 'days'}
        </span>
    )
}
