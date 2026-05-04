import { SignedIn, SignedOut, UserButton } from "@neondatabase/neon-js/auth/react/ui"
import { Atom, MoonStar, SunMedium } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Link } from "react-router-dom"

import { SignOutButton } from "@/components/auth/SignOutButton"
import { useThemeMode } from "@/hooks/useThemeMode"
import { AppModeToggle } from "@/components/shared/AppModeToggle"

interface AuthShellProps {
  eyebrow: string
  title: string
  subtitle: string
  panelTitle: string
  panelCopy: string
  children: ReactNode
}

const SECURITY_NOTES = [
  "Authentication is checked before protected workspace data is fetched.",
  "Simulation runs and benchmarks require an active session.",
  "Theme state stays synchronized across landing, docs, account, and the workspace.",
]

export function AuthShell({ eyebrow, title, subtitle, panelTitle, panelCopy, children }: AuthShellProps) {
  const { theme, setTheme } = useThemeMode()

  return (
    <div style={pageStyle}>
      <div style={backdropOrbAStyle} />
      <div style={backdropOrbBStyle} />

      <header style={headerStyle}>
        <Link to="/" style={brandStyle}>
          <div style={brandBadgeStyle}>
            <Atom size={16} />
          </div>
          <div>
            <div style={brandEyebrowStyle}>QPAL</div>
            <div style={{ fontWeight: 700 }}>Quantum Protocol Algorithm Simulator</div>
          </div>
        </Link>

        <div style={headerActionsStyle}>
          <ThemeButton label="Dark" active={theme === "dark"} onClick={() => setTheme("dark")} icon={<MoonStar size={14} />} />
          <ThemeButton label="Light" active={theme === "light"} onClick={() => setTheme("light")} icon={<SunMedium size={14} />} />
          <AppModeToggle />
          <SignedOut>
            <Link to="/login" style={headerLinkStyle}>
              Log in
            </Link>
          </SignedOut>
          <SignedIn>
            <SignOutButton style={headerLinkStyle} />
            <div style={userButtonShellStyle}>
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </header>

      <main style={contentGridStyle}>
        <section style={narrativeCardStyle}>
          <div style={eyebrowStyle}>{eyebrow}</div>
          <h1 style={titleStyle}>{title}</h1>
          <p style={subtitleStyle}>{subtitle}</p>

          <div style={panelStyle}>
            <div style={eyebrowStyle}>WHY THIS FLOW</div>
            <h2 style={{ fontSize: 22, marginBottom: 10 }}>{panelTitle}</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{panelCopy}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SECURITY_NOTES.map((note) => (
              <div key={note} style={noteRowStyle}>
                <div style={noteBulletStyle} />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={authPanelStyle}>
          <div style={eyebrowStyle}>SIGN IN</div>
          {children}
        </section>
      </main>
    </div>
  )
}

function ThemeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...themeButtonStyle,
        borderColor: active ? "var(--accent-cyan)" : "var(--border)",
        background: active ? "var(--bg-active)" : "var(--bg-card)",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
      }}
    >
      {icon}
      {label}
    </button>
  )
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: 20,
  position: "relative",
  overflow: "hidden",
}

const backdropOrbAStyle: CSSProperties = {
  position: "absolute",
  width: 420,
  height: 420,
  borderRadius: "50%",
  top: -120,
  right: -120,
  background: "radial-gradient(circle, rgba(69, 111, 154, 0.18) 0%, transparent 68%)",
  pointerEvents: "none",
}

const backdropOrbBStyle: CSSProperties = {
  position: "absolute",
  width: 360,
  height: 360,
  borderRadius: "50%",
  bottom: -120,
  left: -120,
  background: "radial-gradient(circle, rgba(45, 106, 90, 0.18) 0%, transparent 68%)",
  pointerEvents: "none",
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

const brandBadgeStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  border: "1px solid var(--border)",
  background: "var(--bg-panel)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--accent-cyan)",
  boxShadow: "var(--shadow-card)",
}

const brandEyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.08em",
  color: "var(--text-muted)",
}

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
}

const headerLinkStyle: CSSProperties = {
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

const contentGridStyle: CSSProperties = {
  width: "min(1180px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
  gap: 18,
  alignItems: "start",
  position: "relative",
  zIndex: 1,
}

const narrativeCardStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: "28px",
  boxShadow: "var(--shadow-card)",
  display: "flex",
  flexDirection: "column",
  gap: 18,
}

const authPanelStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: "24px",
  boxShadow: "var(--shadow-card)",
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  marginBottom: 6,
}

const titleStyle: CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "clamp(2.4rem, 5vw, 4.6rem)",
  lineHeight: 1.04,
}

const subtitleStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.75,
  color: "var(--text-secondary)",
  maxWidth: 620,
}

const panelStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 18,
}

const noteRowStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  gap: 12,
  color: "var(--text-secondary)",
}

const noteBulletStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "var(--accent-cyan)",
  flexShrink: 0,
  boxShadow: "0 0 18px rgba(45, 106, 90, 0.38)",
}

const themeButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  padding: "10px 12px",
  fontWeight: 700,
}
