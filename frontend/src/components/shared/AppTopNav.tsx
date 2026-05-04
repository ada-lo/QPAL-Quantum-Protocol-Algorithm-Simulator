import { SignedIn, SignedOut, UserButton } from "@neondatabase/neon-js/auth/react/ui"
import { Atom, MoonStar, SunMedium } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Link } from "react-router-dom"

import { SignOutButton } from "@/components/auth/SignOutButton"
import { useThemeMode } from "@/hooks/useThemeMode"
import { getStoredAppMode } from "@/lib/appMode"
import { AppModeToggle } from "./AppModeToggle"

interface AppTopNavProps {
  title?: string
  subtitle?: string
  links?: Array<{ to: string; label: string }>
  authRedirect?: string
}

export function AppTopNav({ title = "QPAL", subtitle = "Quantum Protocol Algorithm Simulator", links = [], authRedirect = "/" }: AppTopNavProps) {
  const { theme, setTheme } = useThemeMode()
  const mode = getStoredAppMode()

  return (
    <header style={headerStyle}>
      <Link to="/" style={brandStyle}>
        <div style={brandMarkStyle}>
          <Atom size={18} />
        </div>
        <div>
          <div style={eyebrowStyle}>{title}</div>
          <div style={{ fontWeight: 700 }}>{subtitle}</div>
        </div>
      </Link>

      <div style={actionsStyle}>
        {links.map((link) => (
          <Link key={link.to} to={link.to} style={secondaryActionStyle}>
            {link.label}
          </Link>
        ))}
        <AppModeToggle mode={mode} />
        <ThemeButton active={theme === "dark"} icon={<MoonStar size={14} />} label="Dark" onClick={() => setTheme("dark")} />
        <ThemeButton active={theme === "light"} icon={<SunMedium size={14} />} label="Light" onClick={() => setTheme("light")} />
        <SignedOut>
          <Link to="/login" style={primaryActionStyle}>
            Log in
          </Link>
        </SignedOut>
        <SignedIn>
          <SignOutButton style={secondaryActionStyle} redirectTo={authRedirect} />
          <div style={userButtonShellStyle}>
            <UserButton />
          </div>
        </SignedIn>
      </div>
    </header>
  )
}

function ThemeButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...themeButtonStyle,
        borderColor: active ? "var(--accent-cyan)" : "var(--border)",
        background: active ? "var(--bg-active)" : "var(--bg-card)",
      }}
    >
      {icon}
      {label}
    </button>
  )
}

const headerStyle: CSSProperties = {
  width: "min(1180px, 100%)",
  margin: "0 auto 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  position: "relative",
  zIndex: 1,
}

const brandStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 12,
  textDecoration: "none",
}

const brandMarkStyle: CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--accent-cyan)",
  boxShadow: "var(--shadow-card)",
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
}

const actionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
}

const themeButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "10px 12px",
  fontWeight: 700,
}

const primaryActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  color: "var(--button-primary-text)",
  padding: "10px 14px",
  textDecoration: "none",
  fontWeight: 700,
}

const secondaryActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  padding: "10px 14px",
  textDecoration: "none",
  fontWeight: 700,
}

const userButtonShellStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
}
