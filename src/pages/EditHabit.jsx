import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useHabitsStore } from '../store/habitsStore'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Toggle from '../components/common/Toggle'
import DaySelector from '../components/habits/DaySelector'

const FREQUENCY_OPTIONS = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'one-time', label: 'One Time' },
    { value: 'custom', label: 'More' },
]

const TRACKING_TYPES = [
    { value: 'checkbox', icon: 'check_box', label: 'Checkbox' },
    { value: 'numerical', icon: 'pin', label: 'Numerical' },
]

export default function EditHabit() {
    const { habitId } = useParams()
    const navigate = useNavigate()
    const { habits, updateHabit } = useHabitsStore()

    const habit = habits.find((h) => h.id === habitId)

    const [name, setName] = useState('')
    const [frequency, setFrequency] = useState('daily')
    const [customDays, setCustomDays] = useState([])
    const [trackingType, setTrackingType] = useState('checkbox')
    const [targetValue, setTargetValue] = useState('')
    const [unit, setUnit] = useState('')
    const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
    const [reminderTime, setReminderTime] = useState('')
    const [hasReminder, setHasReminder] = useState(false)
    const [isPrivate, setIsPrivate] = useState(false)
    const [showDaySelector, setShowDaySelector] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Load habit data when component mounts
    useEffect(() => {
        if (habit) {
            setName(habit.title || '')
            setFrequency(habit.frequency || 'daily')
            setCustomDays(habit.customDays || [])
            setTrackingType(habit.completionType || 'checkbox')
            setTargetValue(habit.targetValue || '')
            setUnit(habit.unit || '')
            setTargetDate(habit.targetDate || new Date().toISOString().split('T')[0])
            setReminderTime(habit.reminderTime || '')
            setHasReminder(habit.hasReminder || false)
            setIsPrivate(!habit.isPublic)
        }
    }, [habit])

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

    const isValid = name.trim().length > 0 &&
        (trackingType === 'checkbox' || (targetValue > 0 && unit.trim().length > 0)) &&
        (frequency !== 'one-time' || targetDate)

    const handleFrequencyChange = (value) => {
        setFrequency(value)
        if (value === 'custom') {
            setShowDaySelector(true)
        }
    }

    const handleSubmit = async () => {
        if (!isValid || isSubmitting) return

        setIsSubmitting(true)
        try {
            await updateHabit(habitId, {
                title: name.trim(),
                frequency,
                customDays: frequency === 'custom' ? customDays : [],
                targetDate: frequency === 'one-time' ? targetDate : null,
                reminderTime: reminderTime || null,
                hasReminder: hasReminder && !!reminderTime,
                completionType: trackingType,
                targetValue: trackingType === 'numerical' ? Number(targetValue) : null,
                unit: trackingType === 'numerical' ? unit.trim() : null,
                isPublic: !isPrivate,
            })
            navigate(`/habit/${habitId}`)
        } catch (error) {
            console.error('Failed to update habit:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            {/* Header */}
            <header className="flex items-center p-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex size-12 shrink-0 items-center justify-start text-text-light-primary dark:text-gray-200"
                >
                    <span className="material-symbols-outlined !text-2xl">
                        arrow_back_ios_new
                    </span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-text-light-primary dark:text-gray-200">
                    Edit Habit
                </h1>
                <div className="flex w-12 items-center justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                        className={`text-base font-bold leading-normal tracking-[0.015em] shrink-0 ${isValid && !isSubmitting
                            ? 'text-primary'
                            : 'text-primary/50 dark:text-primary/70'
                            }`}
                    >
                        Save
                    </button>
                </div>
            </header>

            {/* Form */}
            <main className="flex flex-col gap-6 px-4 pt-4 pb-6">
                {/* Name Input */}
                <Input
                    label="Name"
                    id="habitName"
                    placeholder="e.g., Read for 15 minutes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                {/* Frequency */}
                <div className="flex flex-col">
                    <h3 className="text-base font-medium leading-tight tracking-[-0.015em] pb-2 text-gray-800 dark:text-gray-400 uppercase">
                        Frequency
                    </h3>
                    <div className="flex h-12 flex-1 items-center justify-center rounded-lg bg-gray-200/60 dark:bg-gray-800 p-1">
                        {FREQUENCY_OPTIONS.map((option) => (
                            <label
                                key={option.value}
                                className={`
                  flex h-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-md px-1 
                  text-xs font-medium leading-normal transition-all
                  ${frequency === option.value
                                        ? 'bg-white dark:bg-gray-900 text-text-light-primary dark:text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400'
                                    }
                `}
                            >
                                <span className="flex items-center gap-1">
                                    {option.label}
                                    {option.value === 'custom' && (
                                        <span className="material-symbols-outlined !text-base">
                                            expand_more
                                        </span>
                                    )}
                                </span>
                                <input
                                    type="radio"
                                    name="frequency"
                                    value={option.value}
                                    checked={frequency === option.value}
                                    onChange={() => handleFrequencyChange(option.value)}
                                    className="invisible w-0"
                                />
                            </label>
                        ))}
                    </div>

                    {/* One Time Date Picker */}
                    {frequency === 'one-time' && (
                        <div className="mt-3 animation-slide-down">
                            <Input
                                label="Valid only on"
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    )}

                    {frequency === 'custom' && customDays.length > 0 && (
                        <button
                            onClick={() => setShowDaySelector(true)}
                            className="mt-2 text-sm text-primary hover:underline text-left"
                        >
                            {customDays.length} days selected - tap to edit
                        </button>
                    )}
                    {frequency === 'custom' && customDays.length === 0 && (
                        <button
                            onClick={() => setShowDaySelector(true)}
                            className="mt-2 text-sm text-gray-500 hover:text-primary text-left"
                        >
                            Click to select days
                        </button>
                    )}
                </div>

                {/* Reminder / Time */}
                <div className="flex flex-col gap-2">
                    <h3 className="text-base font-medium leading-tight tracking-[-0.015em] text-gray-800 dark:text-gray-400 uppercase">
                        Schedule
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Time (Optional)"
                            type="time"
                            value={reminderTime}
                            onChange={(e) => {
                                setReminderTime(e.target.value)
                                if (e.target.value && !hasReminder) setHasReminder(true)
                            }}
                        />
                        <div className="flex items-end pb-2">
                            <Toggle
                                label="Remind 10m before"
                                checked={hasReminder}
                                onChange={setHasReminder}
                                disabled={!reminderTime}
                            />
                        </div>
                    </div>
                    {hasReminder && !reminderTime && (
                        <p className="text-xs text-danger">Please set a time to enable reminders.</p>
                    )}
                </div>

                {/* Tracking Type */}
                <div className="flex flex-col">
                    <h3 className="text-base font-medium leading-tight tracking-[-0.015em] pb-2 text-gray-800 dark:text-gray-400 uppercase">
                        How will you track it?
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {TRACKING_TYPES.map((type) => (
                            <label
                                key={type.value}
                                className={`
                  flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 py-6 text-center transition-all
                  ${trackingType === type.value
                                        ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                    }
                `}
                            >
                                <span className="material-symbols-outlined !text-3xl">
                                    {type.icon}
                                </span>
                                <span className="font-medium">{type.label}</span>
                                <input
                                    type="radio"
                                    name="tracking_type"
                                    value={type.value}
                                    checked={trackingType === type.value}
                                    onChange={() => setTrackingType(type.value)}
                                    className="invisible w-0"
                                />
                            </label>
                        ))}
                    </div>

                    {/* Numerical Inputs */}
                    {trackingType === 'numerical' && (
                        <div className="grid grid-cols-2 gap-4 mb-4 animation-slide-down">
                            <Input
                                label="Target Goal"
                                type="number"
                                placeholder="e.g. 5"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                min="1"
                            />
                            <Input
                                label="Unit"
                                type="text"
                                placeholder="e.g. cups"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Privacy Toggle */}
                <Toggle
                    label="Make it private?"
                    description="Private habits will not appear on the community feed or your profile."
                    checked={isPrivate}
                    onChange={setIsPrivate}
                />
            </main>

            {/* Submit Button */}
            <footer className="mt-auto px-4 pb-6 pt-4">
                <Button
                    fullWidth
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    disabled={!isValid}
                >
                    Save Changes
                </Button>
            </footer>

            {/* Day Selector Modal */}
            <DaySelector
                isOpen={showDaySelector}
                onClose={() => setShowDaySelector(false)}
                selectedDays={customDays}
                onSave={setCustomDays}
            />
        </div>
    )
}
