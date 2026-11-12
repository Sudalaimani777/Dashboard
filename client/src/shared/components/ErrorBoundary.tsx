import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-surface rounded-xl border border-destructive/30 shadow-xs flex flex-col items-center text-center gap-3 my-4">
          <div className="p-2.5 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-sm font-bold text-ink">
              {this.props.fallbackTitle || 'Unable to render this section'}
            </h3>
            <p className="text-xs text-muted">
              {this.props.fallbackMessage ||
                this.state.error?.message ||
                'An unexpected error occurred while rendering this interface component.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-subtle border border-border-warm text-xs font-semibold text-ink hover:bg-canvas active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="size-3.5 text-muted" /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
