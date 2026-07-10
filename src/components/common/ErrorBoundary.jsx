import { Component } from 'react';

/** Catches render/runtime errors so users get a recovery screen, not a blank page. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App error boundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash">
          <div className="crash-card panel">
            <div className="crash-ic">⚠️</div>
            <h1>Something went wrong</h1>
            <p>The app hit an unexpected error. Your data is saved — reloading usually fixes it.</p>
            <div className="crash-actions">
              <button className="btn solid" onClick={() => window.location.reload()}>Reload app</button>
              <button className="btn ghost" onClick={() => this.setState({ error: null })}>Try again</button>
            </div>
            <pre className="crash-detail">{String(this.state.error?.message || this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
