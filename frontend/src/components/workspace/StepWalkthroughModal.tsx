import * as Dialog from "@radix-ui/react-dialog"
import { Suspense, type CSSProperties } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { ChevronLeft, ChevronRight, Terminal, Layers, Activity, CheckCircle2 } from "lucide-react"

import { BlochScene } from "@/components/bloch/BlochScene"
import { useSimStore } from "@/store/simStore"
import type { WorkspaceExecutionStep } from "@/lib/workspace/types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface StepWalkthroughModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  steps: WorkspaceExecutionStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onFinish?: () => void
}

// ── Educational Helpers ───────────────────────────────────────────────────────

function derivePedagogicalWhat(opcode: string): string {
  const upper = opcode.toUpperCase()
  if (upper === "H") return "Applies a Hadamard (H) Gate to create an equal superposition of |0⟩ and |1⟩."
  if (upper === "X") return "Applies a Pauli-X (NOT) Gate to flip the qubit state between |0⟩ and |1⟩."
  if (upper === "Z") return "Applies a Pauli-Z Gate to flip the phase of the qubit."
  if (upper === "Y") return "Applies a Pauli-Y Gate, combining a bit flip and a phase flip."
  if (["CNOT", "CX"].includes(upper)) return "Applies a Controlled-NOT Gate. It flips the target qubit only if the control qubit is |1⟩."
  if (["CZ"].includes(upper)) return "Applies a Controlled-Z Gate. It applies a phase flip to the target if the control is |1⟩."
  if (upper === "SWAP") return "Swaps the states of two qubits."
  if (upper === "MEASURE") return "Measures the qubit, collapsing its quantum state into a classical bit (0 or 1)."
  if (upper === "INIT") return "Initializes the qubit to a well-defined starting state (usually |0⟩)."
  return `Executes the ${upper} instruction.`
}

function derivePedagogicalWhy(templateId: string | undefined, opcode: string, stepIndex: number): string {
  const upper = opcode.toUpperCase()
  if (!templateId) return "This operation manipulates the qubit state to advance the quantum circuit calculation."
  
  if (templateId === "bernstein_vazirani" || templateId === "deutsch_jozsa") {
    if (upper === "H" && stepIndex < 5) return "We apply H gates at the beginning to evaluate all possible input combinations simultaneously (quantum parallelism)."
    if (upper === "H") return "We apply H gates at the end to interfere the computation paths, isolating the correct classical answer."
    if (upper === "X") return "We flip the ancilla qubit to |1⟩ so that the subsequent phase kickback from the oracle works correctly."
    if (upper === "CNOT" || upper === "CX") return "The oracle uses CNOTs to entangle the inputs with the ancilla, encoding the hidden function without measuring."
  }
  
  if (templateId === "bb84" || templateId === "e91_qkd") {
    if (upper === "H") return "H gates randomly change the measurement basis between the standard (Z) and diagonal (X) basis, ensuring cryptographic security."
    if (upper === "SEND") return "The photon is transmitted over the quantum channel to the receiver."
    if (upper === "MEASURE") return "The receiver attempts to measure the photon in a randomly chosen basis."
    if (upper === "INTERCEPT") return "An eavesdropper is measuring the transit photon, which inherently collapses its state and introduces detectable errors."
  }
  
  if (templateId === "quantum_teleportation") {
    if (upper === "H" || upper === "CNOT" || upper === "CX") return "Creates entanglement (a Bell state) that acts as a quantum bridge between Alice and Bob."
    if (upper === "MEASURE") return "Alice measures her qubits, destroying the original state but generating classical bits needed for reconstruction."
    if (upper === "X" || upper === "Z") return "Bob applies corrections based on Alice's classical message, perfectly reconstructing the teleported state."
  }

  return "This operation manipulates the qubit state to advance the algorithm."
}

// ── Gate category labels ──────────────────────────────────────────────────────

function opcodeToCategory(opcode: string): string {
  const upper = opcode.toUpperCase()
  if (["H", "X", "Y", "Z", "S", "T", "RX", "RY", "RZ", "U"].includes(upper)) return "Single-Qubit Gate"
  if (["CNOT", "CX", "CZ", "SWAP", "CCX", "TOFFOLI"].includes(upper)) return "Two/Multi-Qubit Gate"
  if (upper === "MEASURE") return "Measurement"
  if (["SEND", "RECEIVE"].includes(upper)) return "Quantum Transport"
  if (upper === "INTERCEPT") return "Eavesdrop"
  if (upper === "INIT") return "Qubit Initialization"
  return "Operation"
}

function categoryColor(cat: string): string {
  if (cat === "Single-Qubit Gate")  return "var(--accent-cyan)"
  if (cat === "Two/Multi-Qubit Gate") return "#a78bfa"
  if (cat === "Measurement")        return "var(--accent-amber)"
  if (cat === "Quantum Transport")  return "var(--accent-green)"
  if (cat === "Eavesdrop")          return "var(--accent-red)"
  return "var(--text-muted)"
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StepWalkthroughModal({
  open,
  onOpenChange,
  steps,
  currentStep,
  onStepChange,
  onFinish,
}: StepWalkthroughModalProps) {
  const activeTemplate = useSimStore((s) => s.activeTemplate)

  if (steps.length === 0) return null

  const clampedStep = Math.max(0, Math.min(currentStep, steps.length - 1))
  const step = steps[clampedStep]
  const blochVectors = step.state.bloch_vectors ?? []
  const isFirst = clampedStep === 0
  const isLast  = clampedStep === steps.length - 1
  const total   = steps.length

  const category = opcodeToCategory(step.instruction.opcode)
  const catColor  = categoryColor(category)

  const qubitsInvolved = step.instruction.qubits.join(", ") || step.instruction.args.join(", ") || "—"

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle} />
        <Dialog.Content style={contentStyle} aria-label="Step Walkthrough Debugger">

          {/* ═══════════════ LEFT PANE ═══════════════ */}
          <div style={leftPaneStyle}>

            {/* ─ Top eyebrow ─ */}
            <div style={leftHeaderStyle}>
              <div style={eyebrowStyle}>STEP WALKTHROUGH DEBUGGER</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Dialog.Title style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                  Execution Step
                </Dialog.Title>
                <div style={stepCounterStyle}>
                  <span style={{ color: "var(--accent-cyan)", fontVariantNumeric: "tabular-nums", fontSize: 16 }}>{clampedStep + 1}</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: 13 }}> / {total}</span>
                </div>
              </div>

              {/* WHAT, HOW, WHY Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                <div style={{ ...whwCardStyle, background: "rgba(0, 212, 255, 0.08)", borderLeftColor: "var(--accent-cyan)" }}>
                  <div style={{ ...whwLabelStyle, color: "var(--accent-cyan)" }}>WHAT</div>
                  <div style={whwTextStyle}>{derivePedagogicalWhat(step.instruction.opcode)}</div>
                </div>
                <div style={{ ...whwCardStyle, background: "rgba(74, 222, 128, 0.08)", borderLeftColor: "var(--accent-green)" }}>
                  <div style={{ ...whwLabelStyle, color: "var(--accent-green)" }}>HOW</div>
                  <div style={whwTextStyle}>{step.event}</div>
                </div>
                <div style={{ ...whwCardStyle, background: "rgba(167, 139, 250, 0.08)", borderLeftColor: "#a78bfa" }}>
                  <div style={{ ...whwLabelStyle, color: "#a78bfa" }}>WHY</div>
                  <div style={whwTextStyle}>{derivePedagogicalWhy(activeTemplate?.id, step.instruction.opcode, clampedStep)}</div>
                </div>
              </div>
            </div>

            {/* ─ Divider ─ */}
            <hr style={dividerStyle} />

            {/* ─ Instruction chip ─ */}
            <div style={sectionStyle}>
              <div style={sectionLabel}><Terminal size={12} />INSTRUCTION</div>
              <div style={{ ...instrChipStyle, borderColor: catColor, color: catColor }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14 }}>
                  {step.instruction.raw}
                </span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `color-mix(in srgb, ${catColor} 12%, transparent)`, marginLeft: 8, whiteSpace: "nowrap" }}>
                  {category}
                </span>
              </div>
            </div>

            {/* ─ Qubits involved ─ */}
            <div style={sectionStyle}>
              <div style={sectionLabel}><Layers size={12} />QUBITS INVOLVED</div>
              <div style={qubitChipRowStyle}>
                {(step.instruction.qubits.length ? step.instruction.qubits : step.instruction.args).map((q) => (
                  <span key={q} style={qubitChipStyle}>{q}</span>
                ))}
                {step.instruction.qubits.length === 0 && step.instruction.args.length === 0 && (
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                )}
              </div>
            </div>

            {/* ─ Qubit state cards ─ */}
            <div style={sectionStyle}>
              <div style={sectionLabel}><Activity size={12} />QUBIT STATE AT THIS STEP</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {step.state.qubits.map((qubit) => (
                  <div key={qubit.id} style={qubitStateCardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{qubit.id}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "var(--accent-cyan)" }}>{qubit.state_label}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
                      <span>superposition: <b style={{ color: qubit.superposition ? "var(--accent-cyan)" : "var(--text-secondary)" }}>{String(qubit.superposition)}</b></span>
                      {qubit.entangled_with.length > 0 && <span>entangled: <b style={{ color: "#a78bfa" }}>{qubit.entangled_with.join(", ")}</b></span>}
                      {qubit.intercepted_by && <span style={{ color: "var(--accent-red)" }}>intercepted by: <b>{qubit.intercepted_by}</b></span>}
                      {qubit.owner && <span>owner: {qubit.owner}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─ Measurements (if any at this step) ─ */}
            {step.state.measurements.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionLabel}>📊 MEASUREMENT RESULTS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {step.state.measurements.map((m, i) => (
                    <div key={i} style={measureRowStyle}>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>{m.qubit}</span>
                      <span style={{ color: "var(--text-muted)" }}>basis {m.basis}</span>
                      <span style={{ fontWeight: 700, color: m.value === 0 ? "var(--accent-cyan)" : "var(--accent-amber)" }}>→ {m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─ Spacer ─ */}
            <div style={{ flex: 1 }} />

            {/* ─ Step navigation (pinned bottom) ─ */}
            <div style={navFooterStyle}>
              <button
                type="button"
                style={{ ...navButtonStyle, opacity: isFirst ? 0.35 : 1, cursor: isFirst ? "not-allowed" : "pointer" }}
                disabled={isFirst}
                onClick={() => onStepChange(clampedStep - 1)}
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              {/* Step progress dots (up to 15 visible) */}
              <div style={dotRailStyle}>
                {steps.slice(Math.max(0, clampedStep - 7), Math.min(total, clampedStep + 8)).map((_, relIdx) => {
                  const absIdx = Math.max(0, clampedStep - 7) + relIdx
                  return (
                    <button
                      key={absIdx}
                      type="button"
                      onClick={() => onStepChange(absIdx)}
                      style={{
                        ...dotStyle,
                        background: absIdx === clampedStep ? "var(--accent-cyan)" : "var(--border)",
                        transform: absIdx === clampedStep ? "scale(1.4)" : "scale(1)",
                      }}
                    />
                  )
                })}
              </div>

              {isLast ? (
                <button
                  type="button"
                  style={{ ...navButtonStyle, background: "var(--accent-cyan)", color: "var(--bg-panel)", border: "none" }}
                  onClick={() => (onFinish ? onFinish() : onOpenChange(false))}
                >
                  Finish & View Output
                  <CheckCircle2 size={17} />
                </button>
              ) : (
                <button
                  type="button"
                  style={{ ...navButtonStyle, color: "var(--accent-cyan)" }}
                  onClick={() => onStepChange(clampedStep + 1)}
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              )}
            </div>
          </div>

          {/* ═══════════════ RIGHT PANE ═══════════════ */}
          <div style={rightPaneStyle}>
            <div style={rightHeaderStyle}>
              <div style={eyebrowStyle}>BLOCH SPHERE STATE</div>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                Live 3D qubit state vectors for step {clampedStep + 1}. Drag to orbit.
              </p>
            </div>

            <div style={blochScrollStyle}>
              {blochVectors.length === 0 ? (
                <div style={emptyBlochStyle}>
                  No Bloch vector data at this step.<br />
                  <span style={{ fontSize: 11, opacity: 0.6 }}>Bloch vectors are available for single-qubit states before measurement.</span>
                </div>
              ) : (
                <div style={blochGridStyle}>
                  {blochVectors.map((vector) => {
                    const purity = vector.purity ?? Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2)
                    const purityColor =
                      purity >= 0.95 ? "var(--accent-green)" :
                      purity >= 0.4  ? "var(--accent-amber)" :
                      "var(--accent-red)"
                    return (
                      <div key={`${vector.qubit}-${clampedStep}`} style={blochCardStyle}>
                        {/* Card header */}
                        <div style={blochCardHeaderStyle}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{vector.qubit}</span>
                          <span style={{
                            fontSize: 11, color: purityColor, fontFamily: "var(--font-mono)",
                            padding: "2px 8px", borderRadius: 6,
                            background: `color-mix(in srgb, ${purityColor} 15%, transparent)`,
                            fontWeight: 600,
                          }}>
                            {purity >= 0.95 ? "pure" : purity >= 0.4 ? "mixed" : "max-mixed"} {(purity * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Three.js canvas */}
                        <div style={{ height: 240, background: "var(--bg-primary)", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}>
                          <Canvas camera={{ position: [0, 0, 2.9], fov: 42 }}>
                            <Suspense fallback={null}>
                              <BlochScene bv={{ x: vector.x, y: vector.y, z: vector.z }} />
                              <OrbitControls
                                enablePan={false}
                                enableZoom
                                minDistance={1.8}
                                maxDistance={5.5}
                                autoRotate
                                autoRotateSpeed={0.4}
                              />
                            </Suspense>
                          </Canvas>
                        </div>

                        {/* XYZ coords */}
                        <div style={blochCoordsStyle}>
                          <span>x={vector.x.toFixed(3)}</span>
                          <span>y={vector.y.toFixed(3)}</span>
                          <span>z={vector.z.toFixed(3)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Qubit transmission log */}
              {step.state.transmissions.length > 0 && (
                <div style={transmissionBoxStyle}>
                  <div style={{ ...eyebrowStyle, marginBottom: 10 }}>QUANTUM CHANNEL EVENTS</div>
                  {step.state.transmissions.map((t, i) => (
                    <div key={i} style={transmissionRowStyle}>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>{t.qubit}</span>
                      <span style={{
                        padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                        color: t.status === "intercepted" ? "var(--accent-red)" : "var(--accent-green)",
                        background: t.status === "intercepted" ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.12)",
                      }}>{t.status.toUpperCase()}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                        {t.from_actor} → {t.to_actor ?? "?"}
                        {t.intercepted_by && <span style={{ color: "var(--accent-red)" }}> (Eve: {t.intercepted_by})</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 300,
  background: "rgba(3, 6, 14, 0.82)",
  backdropFilter: "blur(8px)",
}

const contentStyle: CSSProperties = {
  position: "fixed",
  inset: "3vh 3vw",
  zIndex: 301,
  display: "flex",
  flexDirection: "row",
  borderRadius: "var(--radius-xl, 16px)",
  border: "1px solid var(--border)",
  background: "var(--bg-panel)",
  boxShadow: "0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,212,255,0.06)",
  overflow: "hidden",
}

// ── Left pane ──────────────────────────────────────────────────────────────

const leftPaneStyle: CSSProperties = {
  width: "40%",
  minWidth: 340,
  display: "flex",
  flexDirection: "column",
  borderRight: "1px solid var(--border)",
  overflowY: "auto",
  background: "var(--bg-panel)",
}

const leftHeaderStyle: CSSProperties = {
  padding: "24px 24px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const eyebrowStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.14em",
  color: "var(--accent-cyan)",
  fontFamily: "var(--font-mono)",
}

const stepCounterStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
}

const dividerStyle: CSSProperties = {
  border: "none",
  borderTop: "1px solid var(--border)",
  margin: 0,
}

const sectionStyle: CSSProperties = {
  padding: "16px 24px 0",
}

const sectionLabel: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  marginBottom: 10,
}

const instrChipStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
  padding: "10px 14px",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
}

const qubitChipRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
}

const qubitChipStyle: CSSProperties = {
  padding: "5px 12px",
  borderRadius: 999,
  border: "1px solid rgba(0,212,255,0.3)",
  background: "rgba(0,212,255,0.07)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--accent-cyan)",
  fontWeight: 600,
}

const qubitStateCardStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
}

const measureRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
}

const navFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 20px 20px",
  borderTop: "1px solid var(--border)",
  background: "var(--bg-panel)",
  gap: 12,
  marginTop: 12,
}

const whwCardStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "var(--radius-md, 8px)",
  borderLeft: "4px solid transparent",
}

const whwLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.1em",
  marginBottom: 4,
}

const whwTextStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--text-primary)",
}

const navButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 16px",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontWeight: 600,
  fontSize: 13,
  transition: "opacity 0.15s",
}

const dotRailStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  flex: 1,
  justifyContent: "center",
}

const dotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  border: "none",
  padding: 0,
  cursor: "pointer",
  transition: "background 0.15s, transform 0.15s",
}

// ── Right pane ─────────────────────────────────────────────────────────────

const rightPaneStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "var(--bg-primary)",
}

const rightHeaderStyle: CSSProperties = {
  padding: "24px 24px 16px",
  borderBottom: "1px solid var(--border)",
  background: "var(--bg-panel)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
}

const blochScrollStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: 20,
}

const blochGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 16,
}

const blochCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg, 12px)",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  overflow: "hidden",
}

const blochCardHeaderStyle: CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}

const blochCoordsStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  padding: "8px 14px 12px",
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "var(--text-secondary)",
}

const emptyBlochStyle: CSSProperties = {
  minHeight: 240,
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  borderRadius: "var(--radius-lg, 12px)",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  lineHeight: 2,
}

const transmissionBoxStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: "var(--radius-lg, 12px)",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
}

const transmissionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "7px 0",
  borderBottom: "1px solid var(--border)",
  fontSize: 12,
  flexWrap: "wrap",
}
