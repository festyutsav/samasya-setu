import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset,
        });
      }

      return (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md rounded-2xl border border-[#dbe5df] bg-white p-6 shadow-sm">
            <span className="text-3xl">⚠️</span>
            <h2 className="mt-3 text-lg font-bold text-[#173d3a]">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-[#71827c]">
              An unexpected error occurred. Your saved data is safe.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-4 inline-flex items-center rounded-xl bg-[#0b514a] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#073f3a]"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
