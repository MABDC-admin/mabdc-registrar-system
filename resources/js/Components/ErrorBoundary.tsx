import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl border border-red-100">
                        <div>
                            <h2 className="mt-6 text-center text-3xl font-extrabold text-red-600">
                                React Component Error
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                Something went wrong in the frontend rendering.
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-md overflow-auto max-h-96 border border-red-200">
                            <h3 className="text-lg font-medium text-red-800">
                                {this.state.error && this.state.error.toString()}
                            </h3>
                            <pre className="mt-4 text-xs text-red-900 font-mono whitespace-pre-wrap">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
