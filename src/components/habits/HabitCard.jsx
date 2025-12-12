import { useNavigate } from 'react-router-dom'
import StreakBadge from './StreakBadge'

export default function HabitCard({
    habit,
    isCompleted,
    onToggle,
    currentValue,
    onUpdateProgress,
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
                habit.completionType === 'numerical' ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => !disabled && onUpdateProgress(habit.id, Math.max(0, (currentValue || 0) - 1))}
                            disabled={disabled || (currentValue || 0) <= 0}
                            className={`size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="material-symbols-outlined text-lg">remove</span>
                        </button>

                        <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {currentValue || 0}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase">
                                / {habit.targetValue} {habit.unit}
                            </span>
                        </div>

                        <button
                            onClick={() => !disabled && onUpdateProgress(habit.id, (currentValue || 0) + 1)}
                            disabled={disabled}
                            className={`size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                    </div>
                ) : (
                    <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={handleCheckboxChange}
                        onClick={(e) => e.stopPropagation()}
                        disabled={disabled}
                        className={`h-6 w-6 rounded-md border-border-light dark:border-border-dark border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:border-border-light dark:focus:border-border-dark focus:outline-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            }`}
                    />
                )
            )}
        </div>
    )
}
