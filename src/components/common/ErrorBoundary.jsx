import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo)
        this.setState({ errorInfo })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-gray-900">
                    <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h1>
                    <p className="mb-4 text-gray-700">The application encountered an error.</p>
                    <div className="bg-gray-100 p-4 rounded overflow-auto max-w-full text-left font-mono text-sm border border-gray-300">
                        <p className="font-bold text-red-500 mb-2">{this.state.error && this.state.error.toString()}</p>
                        <pre className="text-xs text-gray-500 whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Reload Application
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
