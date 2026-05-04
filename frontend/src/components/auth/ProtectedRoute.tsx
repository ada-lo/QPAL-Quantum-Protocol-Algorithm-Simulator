import { AuthLoading, SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react/ui"
import type { CSSProperties, ReactNode } from "react"
import { Navigate } from "react-router-dom"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div style={loadingShellStyle}>
          <div style={loadingCardStyle}>
            <div style={loadingEyebrowStyle}>SECURE WORKSPACE</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Checking your session...</div>
          </div>
        </div>
      </AuthLoading>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  )
}

const loadingShellStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
}

const loadingCardStyle: CSSProperties = {
  width: "min(420px, 100%)",
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-card)",
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 10,
}

const loadingEyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
}
