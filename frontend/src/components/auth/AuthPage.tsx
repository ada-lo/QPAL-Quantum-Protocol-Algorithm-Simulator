import { AuthView } from "@neondatabase/neon-js/auth/react/ui"
import { useLocation } from "react-router-dom"

import { AuthShell } from "./AuthShell"

function resolveAuthPath(pathname: string) {
  if (pathname === "/login") return "sign-in" as never
  if (pathname === "/signup") return "sign-up" as never
  const rawPath = pathname.replace(/^\/auth\/?/, "")
  return (rawPath || "sign-in") as never
}

export function AuthPage() {
  const location = useLocation()
  const authPath = resolveAuthPath(location.pathname)

  return (
    <AuthShell
      eyebrow="LOGIN / SIGNUP"
      title="Continue into QPAL."
      subtitle="Sign in with email and password to reach mode selection, the learner tracks, and the researcher workspace from one shared account."
      panelTitle="One entry point for both flows."
      panelCopy="After authentication you will land on mode selection, where you can choose Learner or Researcher and switch again later from the navigation bar."
    >
      <AuthView path={authPath} />
    </AuthShell>
  )
}
