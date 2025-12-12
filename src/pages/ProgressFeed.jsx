import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFeedStore } from '../store/feedStore'
import { getTimeAgo } from '../services/feed'
import BottomNav from '../components/common/BottomNav'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function ProgressFeed() {
    const navigate = useNavigate()
    const { posts: feedItems, isLoading, fetchFeed } = useFeedStore()

    useEffect(() => {
        fetchFeed()
    }, [])

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/80 bg-background-light/80 p-4 pb-3 backdrop-blur-sm dark:border-gray-800/80 dark:bg-background-dark/80">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-12 shrink-0 items-center justify-start"
                >
                    <span className="material-symbols-outlined text-text-light-primary dark:text-text-dark-primary">
                        arrow_back_ios_new
                    </span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-text-light-primary dark:text-text-dark-primary">
                    Progress Feed
                </h1>
                <div className="flex w-12 items-center justify-end">
                    <button className="flex h-12 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-transparent text-base font-bold leading-normal tracking-[0.015em] text-text-light-primary dark:text-text-dark-primary">
                        <span className="material-symbols-outlined">search</span>
                    </button>
                </div>
            </header>

            {/* Feed */}
            <main className="flex-grow pb-24">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : feedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <span className="material-symbols-outlined text-5xl text-gray-400 mb-4">
                            feed
                        </span>
                        <p className="text-gray-500 dark:text-gray-400 text-center">
                            No public activity yet.
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm text-center mt-2">
                            Complete public habits to appear in the feed!
                        </p>
                    </div>
                ) : (
                    feedItems.map((item) => (
                        <div
                            key={item.id}
                            className="border-b border-gray-200/80 p-4 dark:border-gray-800/80"
                        >
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                {item.photoURL ? (
                                    <img
                                        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                                        alt={`${item.username}'s avatar`}
                                        src={item.photoURL}
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-primary text-xl">
                                            person
                                        </span>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex flex-1 flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-text-light-primary dark:text-text-dark-primary">
                                            {item.username}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            · {getTimeAgo(item.timestamp)}
                                        </p>
                                    </div>

                                    <p className="text-base text-text-light-primary dark:text-text-dark-primary">
                                        Completed: {item.habitTitle}
                                    </p>

                                    {/* Streak Badge */}
                                    {item.streak > 0 && (
                                        <div className="mt-2 flex items-center">
                                            <div className="flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-sm font-medium">
                                                <span className="material-symbols-outlined !text-[18px] !font-bold text-primary">
                                                    local_fire_department
                                                </span>
                                                <span className="font-bold text-text-light-primary dark:text-text-dark-primary">
                                                    {item.streak}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    )
}
