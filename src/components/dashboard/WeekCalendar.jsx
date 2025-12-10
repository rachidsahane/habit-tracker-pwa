import { useMemo } from 'react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeekCalendar({ selectedDate, onDateSelect, completionsByDate = {} }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekDays = useMemo(() => {
        const days = []
        const startOfWeek = new Date(today)
        const dayOfWeek = today.getDay()
        startOfWeek.setDate(today.getDate() - dayOfWeek) // Start from Sunday

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek)
            date.setDate(startOfWeek.getDate() + i)
            days.push(date)
        }
        return days
    }, [])

    const isToday = (date) => {
        return date.toDateString() === today.toDateString()
    }

    const isSelected = (date) => {
        if (!selectedDate) return isToday(date)
        return date.toDateString() === new Date(selectedDate).toDateString()
    }

    const getDateKey = (date) => {
        return date.toISOString().split('T')[0]
    }

    const hasCompletions = (date) => {
        const key = getDateKey(date)
        return completionsByDate[key] && completionsByDate[key].length > 0
    }

    const isPastDate = (date) => {
        return date < today && !isToday(date)
    }

    return (
        <div className="flex overflow-x-auto no-scrollbar pt-2 pb-4 px-4">
            <div className="flex space-x-3">
                {weekDays.map((date) => {
                    const selected = isSelected(date)
                    const hasActivity = hasCompletions(date)
                    const isPast = isPastDate(date)

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => onDateSelect?.(date)}
                            className={`
                flex flex-col items-center justify-center w-14 h-24 rounded-xl flex-shrink-0 transition-all
                ${selected
                                    ? 'bg-primary'
                                    : 'bg-content-light dark:bg-content-dark border border-border-light dark:border-border-dark'
                                }
              `}
                        >
                            <p
                                className={`text-sm font-medium ${selected
                                        ? 'text-text-light-primary'
                                        : 'text-text-light-secondary dark:text-text-dark-secondary'
                                    }`}
                            >
                                {DAY_NAMES[date.getDay()]}
                            </p>
                            <p
                                className={`text-lg font-bold mt-1 ${selected
                                        ? 'text-text-light-primary'
                                        : 'text-text-light-primary dark:text-text-dark-primary'
                                    }`}
                            >
                                {date.getDate()}
                            </p>
                            <div
                                className={`w-2 h-2 rounded-full mt-2 ${selected
                                        ? 'bg-text-light-primary'
                                        : hasActivity
                                            ? 'bg-primary'
                                            : isPast
                                                ? 'bg-text-light-secondary/30 dark:bg-text-dark-secondary/30'
                                                : 'bg-text-light-secondary dark:bg-text-dark-secondary/50'
                                    }`}
                            />
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
