export default function Toggle({ checked, onChange, label, description }) {
    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between">
                {label && (
                    <h3 className="text-base font-medium leading-tight tracking-[-0.015em] text-gray-800 dark:text-gray-400 uppercase">
                        {label}
                    </h3>
                )}
                <label className="relative inline-flex cursor-pointer items-center">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 dark:after:border-gray-600 after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
            </div>
            {description && (
                <p className="pt-2 text-sm text-gray-500 dark:text-gray-400">
                    {description}
                </p>
            )}
        </div>
    )
}
