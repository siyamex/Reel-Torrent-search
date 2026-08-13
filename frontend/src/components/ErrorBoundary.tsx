import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
    window.location.assign('/');
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-950 px-4 text-center">
          <AlertTriangle className="h-12 w-12 text-accent-500" />
          <h1 className="text-xl font-semibold text-base-100">Something went wrong</h1>
          <p className="max-w-md text-sm text-base-400">
            An unexpected error occurred while rendering the page. Try going back to the home page.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="rounded-full bg-accent-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-400"
          >
            Back to home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
