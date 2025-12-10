import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import Button from '../components/common/Button'

export default function Welcome() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const { isAuthenticated } = useAuthStore()

    // Redirect if already authenticated - use useEffect to avoid setState during render
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true })
        }
    }, [isAuthenticated, navigate])

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        setError(null)
        try {
            await signInWithGoogle()
            navigate('/dashboard')
        } catch (err) {
            console.error('Sign in error:', err)
            setError('Failed to sign in. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const features = [
        {
            icon: 'local_fire_department',
            title: 'Track Streaks',
            description: 'Never miss a day and watch your streaks grow.',
        },
        {
            icon: 'leaderboard',
            title: 'Join Leaderboards',
            description: 'Compete weekly and celebrate wins.',
        },
        {
            icon: 'share',
            title: 'Share Progress',
            description: 'Share your journey or keep it private.',
        },
    ]

    // Don't render welcome if already authenticated (will redirect)
    if (isAuthenticated) {
        return null
    }

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display overflow-x-hidden">
            <div className="flex flex-col grow justify-between">
                {/* Content */}
                <div className="flex flex-col">
                    {/* Hero Image */}
                    <div className="p-4">
                        <div
                            className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-xl min-h-80"
                            style={{
                                backgroundImage: `linear-gradient(135deg, 
                  rgba(19, 236, 91, 0.3) 0%, 
                  rgba(16, 34, 22, 0.5) 50%, 
                  rgba(19, 236, 91, 0.2) 100%),
                  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2313ec5b;stop-opacity:0.3'/%3E%3Cstop offset='100%25' style='stop-color:%23102216;stop-opacity:0.8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='400' height='300'/%3E%3Ccircle cx='100' cy='150' r='60' fill='%2313ec5b' opacity='0.2'/%3E%3Ccircle cx='300' cy='100' r='80' fill='%2313ec5b' opacity='0.15'/%3E%3Ccircle cx='250' cy='220' r='50' fill='%2313ec5b' opacity='0.25'/%3E%3C/svg%3E")`,
                            }}
                        >
                            <div className="p-6 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-6xl">
                                    eco
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-text-light-primary dark:text-gray-100 tracking-tight text-[32px] font-bold leading-tight px-4 text-center pb-3 pt-6">
                        Build Better Habits, Together.
                    </h1>
                    <p className="text-gray-700 dark:text-gray-300 text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">
                        Track your progress, compete with friends, and stay motivated every day.
                    </p>

                    {/* Features */}
                    <div className="flex overflow-x-auto no-scrollbar">
                        <div className="flex items-stretch p-4 gap-4 w-full">
                            {features.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="flex h-full flex-1 flex-col items-center gap-2 text-center rounded-lg min-w-32 pt-4"
                                >
                                    <div className="flex items-center justify-center bg-primary/20 dark:bg-primary/30 h-14 w-14 rounded-full">
                                        <span className="material-symbols-outlined text-primary text-3xl">
                                            {feature.icon}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-text-light-primary dark:text-gray-100 text-base font-medium leading-normal">
                                            {feature.title}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dots indicator */}
                    <div className="flex w-full flex-row items-center justify-center gap-3 py-5">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>
                </div>

                {/* Sign In Button */}
                <div className="p-4 flex flex-col gap-4">
                    {error && (
                        <p className="text-danger text-sm text-center">{error}</p>
                    )}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-primary px-6 text-base font-bold text-gray-900 dark:text-black disabled:opacity-50 transition-all hover:shadow-lg"
                    >
                        {isLoading ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <>
                                <svg
                                    aria-hidden="true"
                                    className="h-6 w-6"
                                    fill="none"
                                    height="24"
                                    preserveAspectRatio="xMidYMid meet"
                                    viewBox="0 0 24 24"
                                    width="24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.3H18.05C17.78 15.68 17.06 16.85 15.96 17.65V20.12H19.64C21.55 18.35 22.56 15.54 22.56 12.25Z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23C14.97 23 17.52 22.02 19.64 20.12L15.96 17.65C14.99 18.31 13.62 18.72 12 18.72C9.09 18.72 6.6 16.83 5.75 14.15H1.97V16.7C3.86 20.48 7.64 23 12 23Z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.75 14.15C5.55 13.59 5.45 12.98 5.45 12.35C5.45 11.72 5.55 11.11 5.75 10.55V7.98H1.97C1.22 9.38 0.77 10.83 0.77 12.35C0.77 13.87 1.22 15.32 1.97 16.7L5.75 14.15Z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.98C13.72 5.98 15.14 6.58 16.22 7.59L19.71 4.1C17.52 2.19 14.97 1 12 1C7.64 1 3.86 3.52 1.97 7.98L5.75 10.55C6.6 7.87 9.09 5.98 12 5.98Z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
