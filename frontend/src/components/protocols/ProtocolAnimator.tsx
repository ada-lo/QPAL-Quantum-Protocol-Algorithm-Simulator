
import { useState } from "react"
import { BB84Animator } from "./BB84Animator"
import { TeleportAnimator } from "./TeleportAnimator"
import { SuperdenseAnimator } from "./SuperdenseAnimator"
import { E91Animator } from "./E91Animator"
import { B92Animator } from "./B92Animator"
import { QECAnimator } from "./QECAnimator"

interface Protocol {
  id: string
  label: string
  subtitle: string
  tag: string
  tagColor: string
  icon: string
  desc: string
}

const PROTOCOLS: Protocol[] = [
  {
    id: "bb84", label: "BB84 QKD", subtitle: "Quantum Key Distribution",
    tag: "cryptography", tagColor: "var(--accent-cyan)",
    icon: "🔐",
    desc: "Generate a shared secret key using quantum mechanics. An eavesdropper introduces detectable errors.",
  },
  {
    id: "e91", label: "E91 (Ekert)", subtitle: "Entanglement-Based QKD",
    tag: "cryptography", tagColor: "#AB47BC",
    icon: "🔗",
    desc: "Security proven via Bell inequality violation — any eavesdropper reduces quantum correlations.",
  },
  {
    id: "b92", label: "B92", subtitle: "Simplified QKD",
    tag: "cryptography", tagColor: "#26A69A",
    icon: "🔑",
    desc: "Uses only 2 non-orthogonal states (|0⟩ and |+⟩) — simpler than BB84 but lower key rate.",
  },
  {
    id: "teleport", label: "Teleportation", subtitle: "Quantum State Transfer",
    tag: "entanglement", tagColor: "var(--accent-purple)",
    icon: "✦",
    desc: "Transmit an unknown qubit state from Alice to Bob using a Bell pair and 2 classical bits.",
  },
  {
    id: "superdense", label: "Superdense Coding", subtitle: "2 bits via 1 qubit",
    tag: "communication", tagColor: "var(--accent-amber)",
    icon: "⇌",
    desc: "Send two classical bits by transmitting a single qubit, exploiting pre-shared entanglement.",
  },
  {
    id: "qec", label: "Error Correction", subtitle: "Detect & Fix Errors",
    tag: "error correction", tagColor: "#FF6F00",
    icon: "🛡️",
    desc: "Encode logical qubits into physical qubits to detect and correct quantum errors via syndrome measurements.",
  },
]

export function ProtocolAnimator() {
  const [active, setActive] = useState("bb84")

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 210, flexShrink: 0, borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)",
          padding: "10px 14px 8px", borderBottom: "1px solid var(--border)",
        }}>QUANTUM PROTOCOLS</div>
        <div style={{ overflow: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {PROTOCOLS.map(p => (
            <button key={p.id} onClick={() => setActive(p.id)} style={{
              textAlign: "left", padding: "10px 12px",
              borderRadius: "var(--radius-md)", transition: "all var(--transition)",
              background: active === p.id ? "var(--bg-hover)" : "transparent",
              border: `1px solid ${active === p.id ? p.tagColor : "transparent"}`,
              cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                <div>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: active === p.id ? p.tagColor : "var(--text-primary)",
                  }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.subtitle}</div>
                </div>
              </div>
              {active === p.id && (
                <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>
                  {p.desc}
                </div>
              )}
              <div style={{ marginTop: 4 }}>
                <span style={{
                  fontSize: 9, fontFamily: "var(--font-mono)",
                  color: p.tagColor, padding: "1px 6px",
                  background: `${p.tagColor}15`,
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${p.tagColor}30`,
                }}>{p.tag}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {active === "bb84"       && <BB84Animator />}
        {active === "e91"        && <E91Animator />}
        {active === "b92"        && <B92Animator />}
        {active === "teleport"   && <TeleportAnimator />}
        {active === "superdense" && <SuperdenseAnimator />}
        {active === "qec"        && <QECAnimator />}
      </div>
    </div>
  )
}

