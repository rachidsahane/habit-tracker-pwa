import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// IMPORTANT: Clear all old localStorage data from previous versions
// Firestore is now the ONLY source of truth - no local caching
// This runs EVERY time the app loads to ensure clean state
const keysToRemove = ['habits-storage', 'auth-storage']
keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        console.log(`[Init] Cleared old localStorage: ${key}`)
    }
})

// Also clear any other potential cached data
const allKeys = Object.keys(localStorage)
allKeys.forEach(key => {
    if (key.startsWith('zustand') || key.includes('habit') || key.includes('auth')) {
        localStorage.removeItem(key)
        console.log(`[Init] Cleared cached data: ${key}`)
    }
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
