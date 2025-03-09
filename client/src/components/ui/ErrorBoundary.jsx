import React from 'react';
import { H3, P } from './typography';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error('Error caught by error boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="card border-danger">
          <div className="card-header bg-danger text-white">
            <H3>Something went wrong</H3>
          </div>
          <div className="card-body">
            <P>We're sorry, an error occurred while loading the weather data.</P>
            <div className="alert alert-info mt-3">
              <details className="mb-0">
                <summary>Technical Details</summary>
                <p className="mt-2 text-danger">{this.state.error?.toString()}</p>
                <pre className="mt-2 bg-light p-3 rounded small">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            </div>
            <button
              className="btn btn-primary mt-3"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary; 