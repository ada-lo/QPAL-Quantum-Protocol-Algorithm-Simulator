import { SignedIn, SignedOut, UserButton } from "@neondatabase/neon-js/auth/react/ui"
import {
  ArrowRight,
  Atom,
  Binary,
  BookOpenText,
  Cpu,
  Gauge,
  LockKeyhole,
  MoonStar,
  Orbit,
  Shield,
  SunMedium,
} from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Link } from "react-router-dom"

import { SignOutButton } from "@/components/auth/SignOutButton"
import { useThemeMode } from "@/hooks/useThemeMode"

const HERO_STATS = [
  { label: "Protocols", value: "BB84, E91, teleportation" },
  { label: "Algorithms", value: "Grover, QFT, QAOA" },
  { label: "Inspection", value: "State, Bloch, runtime analysis" },
]

const FEATURE_CARDS = [
  {
    icon: <Shield size={18} />,
    title: "Learn through runnable models",
    body: "Move from communication protocols to core algorithms without leaving the same simulation surface.",
  },
  {
    icon: <Orbit size={18} />,
    title: "Edit code and circuits together",
    body: "Write QPAL pseudocode, inspect the generated circuit, and refine the model from one connected workspace.",
  },
  {
    icon: <Gauge size={18} />,
    title: "Inspect each step clearly",
    body: "Track measurements, state changes, Bloch vectors, and execution flow as the system evolves.",
  },
]

const EXPERIENCE_RAIL = [
  { icon: <Atom size={16} />, label: "Follow protocol walkthroughs with live state changes" },
  { icon: <Binary size={16} />, label: "Switch between pseudocode, circuit, and visual views" },
  { icon: <Cpu size={16} />, label: "Run benchmarks and compare execution paths when needed" },
  { icon: <BookOpenText size={16} />, label: "Keep reference docs open while building experiments" },
]

export function LandingPage() {
  const { theme, setTheme } = useThemeMode()

  return (
    <div style={pageStyle}>
      <div style={orbNorthStyle} />
      <div style={orbSouthStyle} />

      <header style={headerStyle}>
        <div style={brandStyle}>
          <div style={brandMarkStyle}>
            <Atom size={18} />
          </div>
          <div>
            <div style={eyebrowStyle}>QPAL</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Quantum Protocol Algorithm Simulator</div>
          </div>
        </div>

        <div style={headerActionsStyle}>
          <ThemeToggleButton label="Dark" active={theme === "dark"} icon={<MoonStar size={14} />} onClick={() => setTheme("dark")} />
          <ThemeToggleButton label="Light" active={theme === "light"} icon={<SunMedium size={14} />} onClick={() => setTheme("light")} />
          <SignedOut>
            <Link to="/auth/sign-in" style={secondaryActionStyle}>
              Sign in
            </Link>
            <Link to="/auth/sign-up" style={primaryActionStyle}>
              Create account
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/workspace" style={primaryActionStyle}>
              Launch workspace
            </Link>
            <SignOutButton style={secondaryActionStyle} />
            <div style={userButtonShellStyle}>
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </header>

      <main style={contentStyle}>
        <section style={heroGridStyle}>
          <div style={heroPanelStyle}>
            <div style={eyebrowStyle}>QUANTUM WORKSPACE</div>
            <h1 style={heroTitleStyle}>Build, test, and understand quantum systems in one place.</h1>
            <p style={heroBodyStyle}>
              QPAL brings protocol walkthroughs, algorithm experiments, and step-by-step inspection into a single workspace so you can move
              from idea to simulation without stitching together separate tools.
            </p>

            <div style={heroActionsStyle}>
              <SignedOut>
                <Link to="/auth/sign-in" style={primaryCtaStyle}>
                  Sign in
                  <ArrowRight size={16} />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/workspace" style={primaryCtaStyle}>
                  Open workspace
                  <ArrowRight size={16} />
                </Link>
              </SignedIn>
              <Link to="/docs" style={secondaryCtaStyle}>
                Explore docs
              </Link>
            </div>

            <div style={statGridStyle}>
              {HERO_STATS.map((item) => (
                <article key={item.label} style={statCardStyle}>
                  <div style={statLabelStyle}>{item.label}</div>
                  <div style={statValueStyle}>{item.value}</div>
                </article>
              ))}
            </div>
          </div>

          <aside style={signalPanelStyle}>
            <div style={eyebrowStyle}>ACCESS</div>
            <SignedOut>
              <h2 style={signalTitleStyle}>Sign in when you are ready to run the full simulator.</h2>
              <p style={signalBodyStyle}>
                The documentation is open to browse. Sign in to launch protected simulations, benchmarks, and account settings.
              </p>

              <div style={signalCardStyle}>
                <div style={signalIconStyle}>
                  <LockKeyhole size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Secure workspace access</div>
                  <div style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    Experiments and account tools stay behind authentication, while the docs remain available from the public site.
                  </div>
                </div>
              </div>

              <div style={signalRailStyle}>
                <Link to="/auth/sign-in" style={primaryActionStyle}>
                  Sign in
                </Link>
                <Link to="/auth/sign-up" style={secondaryActionStyle}>
                  Create account
                </Link>
              </div>
            </SignedOut>

            <SignedIn>
              <h2 style={signalTitleStyle}>You are signed in and ready to continue.</h2>
              <p style={signalBodyStyle}>
                Open the workspace, review the docs, or manage your account from the same session.
              </p>

              <div style={signedInCardStyle}>
                <div style={signedInPillStyle}>Signed in</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ color: "var(--text-secondary)" }}>Pick up your next simulation or review the reference material first.</div>
                  <div style={userButtonShellStyle}>
                    <UserButton />
                  </div>
                </div>
              </div>

              <div style={signalRailStyle}>
                <Link to="/workspace" style={primaryActionStyle}>
                  Continue to workspace
                </Link>
                <Link to="/account/profile" style={secondaryActionStyle}>
                  Manage account
                </Link>
              </div>
            </SignedIn>
          </aside>
        </section>

        <section style={featureGridStyle}>
          {FEATURE_CARDS.map((card) => (
            <article key={card.title} style={featureCardStyle}>
              <div style={featureIconStyle}>{card.icon}</div>
              <h2 style={featureTitleStyle}>{card.title}</h2>
              <p style={featureBodyStyle}>{card.body}</p>
            </article>
          ))}
        </section>

        <section style={experienceShellStyle}>
          <div style={experienceIntroStyle}>
            <div style={eyebrowStyle}>WHAT YOU CAN DO</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontFamily: "var(--font-serif)", marginBottom: 10 }}>
              Built for protocol flow, algorithm practice, and clear state inspection.
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.75 }}>
              Start with the docs, open a guided model, or build from scratch. QPAL keeps the editor, circuit view, and inspection tools aligned
              so the interface feels like a real working environment instead of a disconnected demo.
            </p>
          </div>

          <div style={experienceRailStyle}>
            {EXPERIENCE_RAIL.map((item) => (
              <div key={item.label} style={experienceItemStyle}>
                <div style={experienceIconStyle}>{item.icon}</div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function ThemeToggleButton({
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
        ...themeToggleStyle,
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

const orbNorthStyle: CSSProperties = {
  position: "absolute",
  top: -180,
  left: -120,
  width: 520,
  height: 520,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(45, 106, 90, 0.22) 0%, transparent 68%)",
  pointerEvents: "none",
}

const orbSouthStyle: CSSProperties = {
  position: "absolute",
  right: -180,
  bottom: -140,
  width: 520,
  height: 520,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(117, 103, 168, 0.14) 0%, transparent 68%)",
  pointerEvents: "none",
}

const headerStyle: CSSProperties = {
  width: "min(1220px, 100%)",
  margin: "0 auto 24px",
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
  gap: 14,
}

const brandMarkStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "16px",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-card)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--accent-cyan)",
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.08em",
  color: "var(--text-muted)",
  marginBottom: 6,
}

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
}

const themeToggleStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  padding: "10px 12px",
  fontWeight: 700,
}

const primaryActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
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
  gap: 8,
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

const contentStyle: CSSProperties = {
  width: "min(1220px, 100%)",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 18,
  position: "relative",
  zIndex: 1,
}

const heroGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
  gap: 18,
  alignItems: "stretch",
}

const heroPanelStyle: CSSProperties = {
  borderRadius: "32px",
  border: "1px solid var(--border)",
  background: "linear-gradient(160deg, var(--bg-panel) 0%, var(--bg-elevated) 100%)",
  boxShadow: "var(--shadow-soft)",
  padding: "32px",
  display: "flex",
  flexDirection: "column",
  gap: 22,
}

const heroTitleStyle: CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "clamp(2.8rem, 6vw, 5.6rem)",
  lineHeight: 0.96,
  maxWidth: 760,
}

const heroBodyStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.82,
  color: "var(--text-secondary)",
  maxWidth: 700,
}

const heroActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
}

const primaryCtaStyle: CSSProperties = {
  ...primaryActionStyle,
  padding: "14px 18px",
}

const secondaryCtaStyle: CSSProperties = {
  ...secondaryActionStyle,
  padding: "14px 18px",
}

const statGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
}

const statCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const statLabelStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-muted)",
}

const statValueStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
}

const signalPanelStyle: CSSProperties = {
  borderRadius: "32px",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-card)",
  padding: "28px",
  display: "flex",
  flexDirection: "column",
  gap: 18,
}

const signalTitleStyle: CSSProperties = {
  fontSize: 28,
  lineHeight: 1.08,
}

const signalBodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.8,
}

const signalCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "16px",
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
}

const signalIconStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--bg-active)",
  color: "var(--accent-cyan)",
  flexShrink: 0,
}

const signalRailStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
}

const signedInCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
}

const signedInPillStyle: CSSProperties = {
  alignSelf: "flex-start",
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid var(--accent-green)",
  color: "var(--accent-green)",
  background: "var(--bg-active)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
}

const featureGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
}

const featureCardStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-card)",
  padding: "22px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
}

const featureIconStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "14px",
  background: "var(--bg-active)",
  color: "var(--accent-cyan)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}

const featureTitleStyle: CSSProperties = {
  fontSize: 20,
}

const featureBodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.76,
}

const experienceShellStyle: CSSProperties = {
  borderRadius: "32px",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-card)",
  padding: "28px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.9fr)",
  gap: 18,
  alignItems: "center",
}

const experienceIntroStyle: CSSProperties = {
  maxWidth: 700,
}

const experienceRailStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
}

const experienceItemStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
  color: "var(--text-secondary)",
}

const experienceIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "var(--bg-active)",
  color: "var(--accent-cyan)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}
