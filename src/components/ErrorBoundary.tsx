import { AlertTriangle } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

// Catches render-time exceptions anywhere below the dashboard shell so the
// whole SPA doesn't go blank. Reports to the console and shows a recovery
// card. Page-level query errors stay handled by QueryState.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-full place-items-center p-6">
        <div className="w-full max-w-md rounded-xl border border-rose-200 bg-white p-6 text-rose-700 shadow-sm dark:border-rose-900 dark:bg-zinc-900 dark:text-rose-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-semibold">Algo se rompió.</h2>
              <p className="mt-1 text-sm text-rose-600/80 dark:text-rose-300/80">
                {this.state.error.message || 'Error desconocido.'}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={this.reset}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
                >
                  Reintentar
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 dark:border-rose-800 dark:text-rose-300"
                >
                  Recargar página
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}