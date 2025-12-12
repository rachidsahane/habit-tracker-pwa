import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getPublicFeed } from '../services/feed'

export const useFeedStore = create(
    persist(
        (set, get) => ({
            posts: [],
            lastUpdated: null,
            isLoading: false,
            error: null,
            lastDoc: null, // For pagination if needed later

            fetchFeed: async (force = false) => {
                const { lastUpdated, isLoading } = get()
                const now = Date.now()
                // Cache duration: 5 minutes. If called within 5 mins, don't auto-fetch unless forced.
                // However, user requested "load cached, update in background". 
                // So we will always fetch but we return immediately if we have posts so UI shows them.

                if (isLoading) return

                set({ isLoading: true, error: null })

                try {
                    const posts = await getPublicFeed(20)

                    // Convert timestamps if needed, but getPublicFeed returns them.
                    // We might need to serialize them for Zustand persist (JSON).
                    const serializedPosts = posts.map(p => ({
                        ...p,
                        timestamp: p.timestamp?.toDate?.()?.toISOString() || p.timestamp
                    }))

                    set({ posts: serializedPosts, lastUpdated: now, isLoading: false })
                } catch (error) {
                    console.error('Error fetching feed:', error)
                    set({ error: error.message, isLoading: false })
                }
            },

            // Helper to just get current posts without triggering fetch if not needed
            // But usually we just use the hook: const { posts } = useFeedStore()
        }),
        {
            name: 'feed-storage', // name of item in the storage (must be unique)
            partialize: (state) => ({ posts: state.posts, lastUpdated: state.lastUpdated }), // Persist posts and timestamp
        }
    )
)
