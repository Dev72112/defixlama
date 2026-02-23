import React, { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureException, addBreadcrumb } from "@/lib/errorTracking/tracking";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Omit<State, 'errorInfo'> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);

    // Store error info for debugging
    this.setState(prev => ({ ...prev, errorInfo }));

    // Track error with error tracking system
    captureException(error, {
      context: this.props.context,
      componentStack: errorInfo.componentStack,
    });

    // Add breadcrumb for debugging
    addBreadcrumb(
      `Error in ${this.props.context || 'unknown'} component`,
      'error-boundary',
      'error'
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log("Error details:", {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        context: this.props.context,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-destructive mb-2">
                  {this.props.context ? `Error in ${this.props.context}` : 'Something went wrong'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {this.state.error?.message || "An unexpected error occurred while rendering this section."}
                </p>
                {import.meta.env.DEV && this.state.errorInfo && (
                  <details className="mb-4 cursor-pointer">
                    <summary className="text-xs text-muted-foreground hover:text-foreground">
                      Debug Info
                    </summary>
                    <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.handleReset}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.handleReload}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

