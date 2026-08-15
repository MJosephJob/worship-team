import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center
                        justify-center bg-gray-950 text-white p-6">
          <h1 className="text-2xl font-bold mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-400 mb-6 text-center">
            An unexpected error occurred. Please reload the app.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-yellow-500 text-black
                       font-semibold rounded-lg hover:bg-yellow-400"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
