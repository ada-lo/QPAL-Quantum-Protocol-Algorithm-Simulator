import { LogOut } from "lucide-react"
import { useState, type CSSProperties } from "react"
import { useNavigate } from "react-router-dom"

import { authClient } from "@/lib/auth/authClient"

interface SignOutButtonProps {
  style?: CSSProperties
  label?: string
  redirectTo?: string
}

export function SignOutButton({
  style,
  label = "Sign out",
  redirectTo = "/",
}: SignOutButtonProps) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    if (pending) return
    setPending(true)

    try {
      await authClient.signOut()
      navigate(redirectTo, { replace: true })
    } catch (error) {
      console.error("Sign out failed", error)
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        padding: "10px 14px",
        fontWeight: 700,
        opacity: pending ? 0.72 : 1,
        ...style,
      }}
    >
      <LogOut size={14} />
      {pending ? "Signing out..." : label}
    </button>
  )
}
