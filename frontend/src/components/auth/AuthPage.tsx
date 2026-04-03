import { AuthView } from "@neondatabase/neon-js/auth/react/ui"
import { useLocation } from "react-router-dom"

import { AuthShell } from "./AuthShell"

function resolveAuthPath(pathname: string) {
  const rawPath = pathname.replace(/^\/auth\/?/, "")
  return (rawPath || "sign-in") as never
}

export function AuthPage() {
  const location = useLocation()
  const authPath = resolveAuthPath(location.pathname)

  return (
    <AuthShell
      eyebrow="SECURE ENTRY"
      title="Sign in to continue to QPAL."
      subtitle="Use your email or provider to enter the workspace, create an account, or recover access from the same entry page."
      panelTitle="One account, every part of the product."
      panelCopy="Your session covers the workspace, docs shortcuts, and account settings without sending you to a disconnected auth flow."
    >
      <AuthView path={authPath} />
    </AuthShell>
  )
}
