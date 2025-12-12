import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary'
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
// Also clear any other potential cached data
// Removed aggressive clearing to preserve settings (habitParams)

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
