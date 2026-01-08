import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
            <div className="max-w-md bg-[#0a0a0c] border border-red-900/30 p-8 rounded-2xl shadow-2xl">
                <div className="text-4xl mb-4">💥</div>
                <h1 className="text-xl font-bold text-white mb-2">Critical System Failure</h1>
                <p className="text-gray-400 text-sm mb-6">
                    The Professor encountered an unrecoverable anomaly. 
                    {this.state.error?.message && <span className="block mt-2 font-mono text-red-400 text-xs bg-black/50 p-2 rounded">{this.state.error.message}</span>}
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
                >
                    Hard Reboot
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}
