export default function Card({ children, className = '', onClick }) {
    return (
        <div
            className={`
        bg-content-light dark:bg-content-dark 
        rounded-xl p-4
        ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors' : ''}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    )
}
