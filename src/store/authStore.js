import { create } from 'zustand'

// Note: We DON'T persist auth state - Firebase Auth handles session persistence
// Persisting auth state can cause stale data issues on reload
export const useAuthStore = create((set) => ({
    user: null,
    isLoading: true,  // Start as true, will be set to false once Firebase auth state is determined
    isAuthenticated: false,

    setUser: (user) =>
        set({
            user,
            isAuthenticated: !!user,
        }),

    setLoading: (isLoading) => set({ isLoading }),

    clearUser: () =>
        set({
            user: null,
            isAuthenticated: false,
        }),
}))
