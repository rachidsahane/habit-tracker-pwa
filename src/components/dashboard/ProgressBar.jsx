export default function ProgressBar({ percentage, showLabel = true }) {
    return (
        <div className="flex flex-col gap-2">
            {showLabel && (
                <div className="flex gap-6 justify-between items-center">
                    <p className="text-text-light-primary dark:text-text-dark-primary text-base font-medium leading-normal">
                        {percentage}% complete today
                    </p>
                    <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-normal leading-normal">
                        {percentage}%
                    </p>
                </div>
            )}
            <div className="rounded-full bg-border-light dark:bg-border-dark/50">
                <div
                    className="h-2 rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                />
            </div>
            {percentage >= 100 && (
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-normal leading-normal">
                    🎉 All done for today!
                </p>
            )}
            {percentage > 0 && percentage < 100 && (
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-normal leading-normal">
                    Keep it up!
                </p>
            )}
        </div>
    )
}
