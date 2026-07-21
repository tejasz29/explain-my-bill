"use client";

import { Component, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  resetKey: string | number;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Bill results rendering failed:", error);
    }
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="animate-float-up rounded-[28px] border border-red-200 bg-red-50/90 px-5 py-5 text-sm text-red-900 shadow-lg">
          <p className="font-semibold text-red-950">Something went wrong reading your bill.</p>
          <p className="mt-2 leading-6">
            The results view hit an unexpected error. Reload the page and try uploading the bill
            again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 min-h-11 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700 transition hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
