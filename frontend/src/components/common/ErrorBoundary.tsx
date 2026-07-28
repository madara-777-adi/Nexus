import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Short heading shown in the fallback UI, e.g. "Workspace graph crashed" */
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary. Wrap any subtree that can throw at runtime
 * (data-fetching components, third-party render libraries like React Flow,
 * etc.) so a thrown error shows a diagnostic panel instead of unmounting
 * the whole page into a blank screen.
 *
 * NOTE: this only catches errors thrown during render / lifecycle methods
 * of its children. It does NOT catch errors inside async callbacks (e.g. a
 * rejected fetch() promise) — those must be caught and turned into state
 * inside the component itself (see WorkspaceGraph.tsx's loadState handling).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Wire this up to Sentry / another error-reporting service when one
    // is wired into the project. For now, at minimum, log the full stack.
    console.error("ErrorBoundary caught a render error:", error, errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#080A0F] px-6 text-center">
          <p className="text-sm font-semibold text-red-400">
            {this.props.fallbackTitle || "Something broke while rendering this view"}
          </p>
          <p className="max-w-md break-words font-mono text-xs text-slate-500">
            {this.state.error?.message || "Unknown error"}
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-neon-lime/50 hover:text-neon-lime"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}