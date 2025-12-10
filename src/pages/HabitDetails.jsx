import { useParams, useNavigate } from 'react-router-dom'
import { useHabitsStore } from '../store/habitsStore'
import BottomNav from '../components/common/BottomNav'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'

const FREQUENCY_LABELS = {
    daily: 'Daily',
    weekly: 'Weekly',
    custom: 'Custom Days',
}

const TRACKING_LABELS = {
    checkbox: 'Check-off',
    numerical: 'Numerical',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function HabitDetails() {
    const { habitId } = useParams()
    const navigate = useNavigate()
    const { habits, deleteHabit, isLoading } = useHabitsStore()

    const habit = habits.find((h) => h.id === habitId)

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
            try {
                await deleteHabit(habitId)
                navigate('/dashboard')
            } catch (error) {
                console.error('Error deleting habit:', error)
                alert('Failed to delete habit. Please try again.')
            }
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!habit) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Habit not found
                    </p>
                    <Button onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    // Format custom days display
    const getCustomDaysDisplay = () => {
        if (habit.frequency !== 'custom' || !habit.customDays?.length) return null
        return habit.customDays.map((d) => DAY_NAMES[d]).join(', ')
    }

    const infoCards = [
        {
            icon: 'event_repeat',
            label: 'Frequency',
            value: habit.frequency === 'custom'
                ? getCustomDaysDisplay()
                : FREQUENCY_LABELS[habit.frequency] || habit.frequency,
        },
        {
            icon: 'task_alt',
            label: 'Completion Type',
            value: TRACKING_LABELS[habit.completionType] || habit.completionType || 'Check-off',
        },
        {
            icon: habit.isPublic ? 'public' : 'lock',
            label: 'Visibility',
            value: habit.isPublic ? 'Public' : 'Private',
        },
    ]

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden font-display bg-background-light dark:bg-background-dark">
            <div className="flex-grow pb-28">
                {/* Header */}
                <header className="flex items-center bg-background-light dark:bg-background-dark p-4 justify-between sticky top-0 z-10 border-b border-border-light dark:border-border-dark">
                    <div className="flex w-12 items-center justify-start">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-text-light-primary dark:text-text-dark-primary gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0"
                        >
                            <span className="material-symbols-outlined">
                                arrow_back_ios_new
                            </span>
                        </button>
                    </div>
                    <h1 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold leading-tight tracking-[-0.015em] text-center">
                        Habit Details
                    </h1>
                    <div className="flex w-12 items-center justify-end">
                        <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-text-light-primary dark:text-text-dark-primary gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0">
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-4">
                    {/* Habit Title Card */}
                    <div className="bg-content-light dark:bg-content-dark rounded-xl p-6 flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary text-center">
                            {habit.title}
                        </h2>
                        {(habit.currentStreak || 0) > 0 && (
                            <div className="mt-4 py-2 px-4 rounded-full bg-primary/20 text-primary flex items-center gap-2">
                                <span
                                    className="material-symbols-outlined text-base"
                                    style={{
                                        fontVariationSettings: "'FILL' 1, 'wght' 700",
                                    }}
                                >
                                    local_fire_department
                                </span>
                                <p className="font-bold text-sm">
                                    Current Streak: {habit.currentStreak}{' '}
                                    {habit.currentStreak === 1 ? 'day' : 'days'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Info Cards */}
                    <div className="mt-4 grid grid-cols-1 gap-4">
                        {infoCards.map((card) => (
                            <div
                                key={card.label}
                                className="bg-content-light dark:bg-content-dark rounded-xl p-4 flex items-center gap-4"
                            >
                                <div className="flex items-center justify-center size-10 rounded-lg bg-primary/20 text-primary">
                                    <span className="material-symbols-outlined">{card.icon}</span>
                                </div>
                                <div>
                                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                        {card.label}
                                    </p>
                                    <p className="text-base font-medium text-text-light-primary dark:text-text-dark-primary">
                                        {card.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col gap-3">
                        <Button
                            fullWidth
                            icon="edit"
                            onClick={() => navigate(`/edit-habit/${habit.id}`)}
                        >
                            Edit Habit
                        </Button>
                        <Button
                            fullWidth
                            variant="danger"
                            icon="delete"
                            onClick={handleDelete}
                        >
                            Delete Habit
                        </Button>
                    </div>
                </main>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    )
}
