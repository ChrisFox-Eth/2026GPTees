/**
 * @module components/ErrorBoundary
 * @description Error boundary component for catching React errors
 * @since 2025-11-21
 */

import { Component, ErrorInfo } from 'react';
import { Button } from '@components/ui';
import type { ErrorBoundaryProps, ErrorBoundaryState } from './ErrorBoundary.types';

/**
 * @class ErrorBoundary
 * @extends {Component<ErrorBoundaryProps, ErrorBoundaryState>}
 * @description React error boundary for catching and displaying errors in child components.
 * Renders a user-friendly error UI with options to return home or reload. Shows error
 * details in development mode. Prevents entire application crashes.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * @constructor
   * @param {ErrorBoundaryProps} props - Component props
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * @static
   * @description Updates state when an error is caught, triggering error UI render
   * @param {Error} error - The error that was thrown
   * @returns {ErrorBoundaryState} New state with error information
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * @description Lifecycle method called after an error is caught. Logs error to console
   * and can be extended to send to error tracking services in production.
   * @param {Error} error - The error that was thrown
   * @param {ErrorInfo} errorInfo - Component stack trace information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // In production, you might want to log this to an error tracking service
  }

  /**
   * @description Resets error state and redirects user to home page
   */
  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
          <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl dark:bg-gray-800">
            <div className="mb-4 text-6xl">😔</div>
            <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Oops! Something went wrong
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-left dark:border-red-800 dark:bg-red-900/20">
                <p className="font-mono text-sm break-all text-red-800 dark:text-red-400">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button variant="primary" onClick={this.handleReset}>
                Return Home
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
