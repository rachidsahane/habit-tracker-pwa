export default function Input({
    label,
    id,
    error,
    className = '',
    ...props
}) {
    return (
        <div className="flex flex-col">
            {label && (
                <label
                    htmlFor={id}
                    className="text-base font-medium leading-normal pb-2 text-gray-800 dark:text-gray-400 uppercase tracking-wide"
                >
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`
          form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden 
          rounded-lg border border-gray-200 dark:border-gray-700 
          bg-white dark:bg-gray-800 
          h-14 p-4 
          text-base font-normal leading-normal 
          text-text-light-primary dark:text-white 
          placeholder:text-gray-400 dark:placeholder:text-gray-500 
          focus:border-primary focus:ring-primary/50 focus:ring-2 focus:outline-none
          transition-colors
          ${error ? 'border-danger focus:border-danger focus:ring-danger/50' : ''}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-danger">{error}</p>
            )}
        </div>
    )
}
