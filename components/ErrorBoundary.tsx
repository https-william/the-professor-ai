import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="max-w-md w-full bg-[#0a0a0a] border border-red-900/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-red-500 mb-2 uppercase tracking-widest">System Critical Failure</h1>
            <p className="text-xs text-gray-500 mb-6 border-b border-red-900/30 pb-4">
              The Neural Link encountered a fatal exception.
            </p>
            
            <div className="bg-black/50 p-4 rounded-lg text-left mb-6 overflow-x-auto border border-white/5">
                <code className="text-[10px] text-red-400 whitespace-pre-wrap">
                    {this.state.error?.message || "Unknown Error"}
                </code>
            </div>

            <button
              onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-black font-bold uppercase text-xs rounded-lg transition-colors shadow-lg"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}