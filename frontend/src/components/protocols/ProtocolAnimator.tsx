import { useState } from "react"
import { B92Animator } from "./B92Animator"
import { BB84Animator } from "./BB84Animator"
import { E91Animator } from "./E91Animator"
import { QECAnimator } from "./QECAnimator"
import { SuperdenseAnimator } from "./SuperdenseAnimator"
import { TeleportAnimator } from "./TeleportAnimator"

interface Protocol {
  id: string
  label: string
  subtitle: string
  tag: string
  tagColor: string
  badge: string
  desc: string
}

const PROTOCOLS: Protocol[] = [
  {
    id: "bb84",
    label: "BB84 QKD",
    subtitle: "Quantum key distribution",
    tag: "cryptography",
    tagColor: "var(--accent-cyan)",
    badge: "QKD",
    desc: "Prepare, transmit, measure, and compare bases to build a key while exposing eavesdropping.",
  },
  {
    id: "e91",
    label: "E91",
    subtitle: "Entanglement-based QKD",
    tag: "cryptography",
    tagColor: "var(--accent-purple)",
    badge: "BELL",
    desc: "Use Bell-correlated entangled pairs so security comes from non-classical correlations.",
  },
  {
    id: "b92",
    label: "B92",
    subtitle: "Simplified QKD",
    tag: "cryptography",
    tagColor: "var(--accent-green)",
    badge: "QKD",
    desc: "Use only two non-orthogonal states and keep the conclusive detection rounds.",
  },
  {
    id: "teleport",
    label: "Teleportation",
    subtitle: "State transfer",
    tag: "entanglement",
    tagColor: "var(--accent-purple)",
    badge: "T",
    desc: "Move an unknown state to Bob by spending a Bell pair and two classical bits.",
  },
  {
    id: "superdense",
    label: "Superdense Coding",
    subtitle: "Two bits through one qubit",
    tag: "communication",
    tagColor: "var(--accent-amber)",
    badge: "2B",
    desc: "Encode two classical bits with one transmitted qubit thanks to shared entanglement.",
  },
  {
    id: "qec",
    label: "Error Correction",
    subtitle: "Detect and repair",
    tag: "error correction",
    tagColor: "var(--accent-red)",
    badge: "QEC",
    desc: "Spread logical information across physical qubits and use syndrome data to recover it.",
  },
]

export function ProtocolAnimator() {
  const [active, setActive] = useState("bb84")
  const current = PROTOCOLS.find((protocol) => protocol.id === active) ?? PROTOCOLS[0]

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", padding: 18, gap: 16 }}>
      <aside
        style={{
          width: 272,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          background: "rgba(251,248,241,0.84)",
        }}
      >
        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
            PROTOCOL LESSONS
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            Security, communication, and entanglement
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.55, color: "var(--text-secondary)" }}>
            Choose one protocol and follow the flow from quantum preparation to classical interpretation.
          </div>
        </div>

        <div style={{ overflow: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: 6 }}>
          {PROTOCOLS.map((protocol) => {
            const isActive = protocol.id === active
            return (
              <button
                key={protocol.id}
                onClick={() => setActive(protocol.id)}
                style={{
                  textAlign: "left",
                  padding: "12px 12px",
                  borderRadius: "var(--radius-md)",
                  transition: "all var(--transition)",
                  background: isActive ? `${protocol.tagColor}10` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isActive ? `${protocol.tagColor}30` : "var(--border)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      minWidth: 40,
                      height: 28,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      background: `${protocol.tagColor}12`,
                      color: protocol.tagColor,
                      border: `1px solid ${protocol.tagColor}24`,
                    }}
                  >
                    {protocol.badge}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? protocol.tagColor : "var(--text-primary)" }}>
                      {protocol.label}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{protocol.subtitle}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>{protocol.desc}</div>
                <div style={{ marginTop: 8 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      color: protocol.tagColor,
                      padding: "2px 6px",
                      background: `${protocol.tagColor}12`,
                      borderRadius: 999,
                      border: `1px solid ${protocol.tagColor}22`,
                    }}
                  >
                    {protocol.tag}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          background: "rgba(251,248,241,0.76)",
        }}
      >
        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
            CURRENT LESSON
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: current.tagColor, marginBottom: 6 }}>{current.label}</div>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: 780 }}>{current.desc}</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {active === "bb84" && <BB84Animator />}
          {active === "e91" && <E91Animator />}
          {active === "b92" && <B92Animator />}
          {active === "teleport" && <TeleportAnimator />}
          {active === "superdense" && <SuperdenseAnimator />}
          {active === "qec" && <QECAnimator />}
        </div>
      </section>
    </div>
  )
}
