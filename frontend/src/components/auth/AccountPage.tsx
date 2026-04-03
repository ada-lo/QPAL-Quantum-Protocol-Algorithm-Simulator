import { AccountView } from "@neondatabase/neon-js/auth/react/ui"
import { useLocation } from "react-router-dom"

import { AuthShell } from "./AuthShell"

function resolveAccountPath(pathname: string) {
  const rawPath = pathname.replace(/^\/account\/?/, "")
  return (rawPath || "profile") as never
}

export function AccountPage() {
  const location = useLocation()
  const accountPath = resolveAccountPath(location.pathname)

  return (
    <AuthShell
      eyebrow="ACCOUNT CONTROLS"
      title="Manage your account."
      subtitle="Update your profile, sessions, and recovery settings without leaving the same workspace experience."
      panelTitle="Your account settings stay inside the product."
      panelCopy="Profile, session, and recovery controls use the same interface and visual language as the rest of QPAL."
    >
      <AccountView path={accountPath} />
    </AuthShell>
  )
}
