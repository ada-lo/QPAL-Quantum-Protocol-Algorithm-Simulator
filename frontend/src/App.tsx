import { Component, type ErrorInfo, type ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { WorkspacePage } from "@/components/workspace/WorkspacePage"
import { WorkspaceDocsPage } from "@/components/workspace/WorkspaceDocsPage"

const SHOW_ERROR_DETAILS = import.meta.env.DEV

interface AppErrorBoundaryState {
  error: Error | null
  componentStack: string
}

class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null, componentStack: "" }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error, componentStack: "" }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Workspace render failed", error, errorInfo)
    this.setState({ componentStack: errorInfo.componentStack ?? "" })
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "linear-gradient(180deg, var(--bg-primary), var(--bg-secondary))",
          }}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--accent-red)",
              background: "var(--bg-panel)",
              boxShadow: "var(--shadow-card)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              WORKSPACE ERROR
            </div>
            <h1 style={{ fontSize: 24 }}>The workspace failed to render.</h1>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {this.state.error.message || "An unknown frontend error prevented the app from mounting."}
            </p>
            {SHOW_ERROR_DETAILS && (
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  overflow: "auto",
                  maxHeight: 280,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-code)",
                  padding: 14,
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  lineHeight: 1.55,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {[this.state.error.stack, this.state.componentStack].filter(Boolean).join("\n\n")}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                alignSelf: "flex-start",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--accent-cyan)",
                background: "var(--accent-cyan)",
                color: "var(--button-primary-text)",
                fontWeight: 700,
              }}
            >
              Reload workspace
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <Routes>
          <Route path="/" element={<WorkspacePage />} />
          <Route path="/docs" element={<WorkspaceDocsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppErrorBoundary>
    </BrowserRouter>
  )
}
