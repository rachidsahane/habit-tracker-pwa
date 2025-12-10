import LoadingSpinner from './LoadingSpinner'

const variants = {
    primary:
        'bg-primary text-text-light-primary shadow-[0_4px_14px_rgba(19,236,91,0.3)] hover:shadow-[0_4px_20px_rgba(19,236,91,0.4)]',
    secondary:
        'bg-transparent text-text-light-primary dark:text-text-dark-primary border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800',
    danger: 'bg-transparent text-danger hover:bg-danger/10',
    google:
        'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm',
}

const sizes = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-base',
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    disabled = false,
    icon,
    className = '',
    ...props
}) {
    return (
        <button
            className={`
        flex items-center justify-center gap-2.5 rounded-xl font-bold
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <LoadingSpinner size="sm" />
            ) : (
                <>
                    {icon && (
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                    )}
                    {children}
                </>
            )}
        </button>
    )
}
