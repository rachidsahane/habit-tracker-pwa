import { useNavigate } from 'react-router-dom'
import StreakBadge from './StreakBadge'

export default function HabitCard({
    habit,
    isCompleted,
    onToggle,
    showCheckbox = true,
    disabled = false,
}) {
    const navigate = useNavigate()

    const handleCardClick = () => {
        navigate(`/habit/${habit.id}`)
    }

    const handleCheckboxChange = (e) => {
        e.stopPropagation()
        if (disabled) return
        onToggle(habit.id)
    }

    return (
        <div
            className={`flex items-center gap-x-4 p-4 rounded-lg bg-content-light dark:bg-content-dark cursor-pointer transition-colors ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
            onClick={!disabled ? handleCardClick : undefined}
        >
            <div className="flex-grow">
                <p className="text-text-light-primary dark:text-text-dark-primary text-base font-normal leading-normal">
                    {habit.title}{' '}
                    {habit.currentStreak > 0 && <StreakBadge streak={habit.currentStreak} />}
                </p>
            </div>

            <span className="material-symbols-outlined text-text-light-secondary dark:text-text-dark-secondary text-base">
                {habit.isPublic ? 'public' : 'lock'}
            </span>

            {showCheckbox && (
                <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={handleCheckboxChange}
                    onClick={(e) => e.stopPropagation()}
                    disabled={disabled}
                    className={`h-6 w-6 rounded-md border-border-light dark:border-border-dark border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:border-border-light dark:focus:border-border-dark focus:outline-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        }`}
                />
            )}
        </div>
    )
}
