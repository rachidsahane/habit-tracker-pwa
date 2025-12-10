import { useState } from 'react'
import Button from '../common/Button'

const DAYS = [
    { key: 0, label: 'S', name: 'Sunday' },
    { key: 1, label: 'M', name: 'Monday' },
    { key: 2, label: 'T', name: 'Tuesday' },
    { key: 3, label: 'W', name: 'Wednesday' },
    { key: 4, label: 'T', name: 'Thursday' },
    { key: 5, label: 'F', name: 'Friday' },
    { key: 6, label: 'S', name: 'Saturday' },
]

export default function DaySelector({ isOpen, onClose, selectedDays = [], onSave }) {
    const [localDays, setLocalDays] = useState(selectedDays)

    const toggleDay = (dayKey) => {
        setLocalDays((prev) =>
            prev.includes(dayKey)
                ? prev.filter((d) => d !== dayKey)
                : [...prev, dayKey]
        )
    }

    const handleSave = () => {
        onSave(localDays)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="flex h-auto w-full flex-col rounded-t-xl bg-background-light dark:bg-gray-800 animate-slide-up">
                <div className="relative flex items-center justify-center border-b border-gray-200 p-4 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                        Select Days
                    </h2>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                        <span className="material-symbols-outlined !text-2xl text-gray-500 dark:text-gray-400">
                            close
                        </span>
                    </button>
                </div>

                <div className="p-4">
                    <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Choose the specific days of the week you want to track this habit.
                    </p>

                    <div className="flex justify-center gap-2">
                        {DAYS.map((day) => {
                            const isSelected = localDays.includes(day.key)
                            return (
                                <button
                                    key={day.key}
                                    onClick={() => toggleDay(day.key)}
                                    className={`
                    relative flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-full border transition-all
                    ${isSelected
                                            ? 'border-primary bg-primary text-black'
                                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary hover:border-primary/50'
                                        }
                  `}
                                    title={day.name}
                                >
                                    <span className="font-bold">{day.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="p-4 pt-2 pb-6">
                    <Button
                        fullWidth
                        onClick={handleSave}
                        disabled={localDays.length === 0}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    )
}
