import { NavLink } from 'react-router-dom'

const navItems = [
    { path: '/dashboard', icon: 'home', label: 'Dashboard' },
    { path: '/leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
    { path: '/feed', icon: 'feed', label: 'Feed' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
]

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-content-light/80 dark:bg-content-dark/80 backdrop-blur-lg border-t border-border-light dark:border-border-dark z-20">
            <div className="flex justify-around items-center h-full max-w-md mx-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 transition-colors ${isActive
                                ? 'text-primary'
                                : 'text-text-light-secondary dark:text-text-dark-secondary'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span
                                    className={`material-symbols-outlined ${isActive ? 'filled' : ''
                                        }`}
                                    style={
                                        isActive
                                            ? { fontVariationSettings: "'FILL' 1, 'wght' 400" }
                                            : {}
                                    }
                                >
                                    {item.icon}
                                </span>
                                <span className={`text-xs ${isActive ? 'font-bold' : ''}`}>
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
