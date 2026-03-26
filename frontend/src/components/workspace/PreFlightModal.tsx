import * as Dialog from "@radix-ui/react-dialog"
import { AlertTriangle, CheckCircle2, Cpu, Zap } from "lucide-react"
import type { CSSProperties } from "react"
import { useCircuitStore } from "@/store/circuitStore"
import { useSimStore, type ComputeTarget, type NoiseModel } from "@/store/simStore"

// ── Props ─────────────────────────────────────────────────────────────────────

interface PreFlightModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

// ── Noise model options ───────────────────────────────────────────────────────

const NOISE_OPTIONS: { value: NoiseModel; label: string; description: string }[] = [
  { value: "ideal",      label: "Ideal (No Noise)",    description: "Perfect unitary gates, no decoherence" },
  { value: "ibm_eagle",  label: "IBM Eagle (127Q)",    description: "Superconducting qubit noise, T1/T2 decoherence" },
  { value: "ibm_osprey", label: "IBM Osprey (433Q)",   description: "High-qubit cross-resonance gate noise model" },
]

// ── Complexity helpers ────────────────────────────────────────────────────────

function computeDepth(gates: { step: number }[]): number {
  if (gates.length === 0) return 0
  return Math.max(...gates.map((g) => g.step)) + 1
}

function complexityScore(qubits: number, depth: number, gateCount: number): number {
  // Weighted score [0–100]: qubits carry the most weight
  const q = Math.min(qubits / 20, 1) * 50
  const d = Math.min(depth / 30, 1) * 30
  const g = Math.min(gateCount / 60, 1) * 20
  return Math.round(q + d + g)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PreFlightModal({ open, onOpenChange, onConfirm }: PreFlightModalProps) {
  // Store reads
  const noiseModel      = useSimStore((s) => s.noiseModel)
  const computeTarget   = useSimStore((s) => s.computeTarget)
  const systemHardware  = useSimStore((s) => s.systemHardware)
  const setNoiseModel   = useSimStore((s) => s.setNoiseModel)
  const setComputeTarget = useSimStore((s) => s.setComputeTarget)

  const nQubits   = useCircuitStore((s) => s.nQubits)
  const gates     = useCircuitStore((s) => s.gates)

  // Circuit metrics
  const gateCount = gates.length
  const depth     = computeDepth(gates)
  const score     = complexityScore(nQubits, depth, gateCount)

  const isHighComplexity = score >= 65
  const gaugeColor =
    score < 50
      ? "var(--accent-cyan)"
      : score < 75
      ? "var(--accent-amber)"
      : "var(--accent-red)"

  // Hardware
  const gpuAvailable = systemHardware?.gpu_available ?? false
  const cpuLabel  = systemHardware ? `CPU: ${systemHardware.cpu}` : "CPU: Local Processor"
  const gpuLabel  = gpuAvailable
    ? `GPU: ${systemHardware?.gpu_name ?? "Detected"}`
    : "GPU"

  function handleConfirm() {
    onOpenChange(false)
    onConfirm()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle} />
        <Dialog.Content style={contentStyle} aria-label="Execution Configuration">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={headerStyle}>
            <div>
              <div style={eyebrowStyle}>PRE-FLIGHT CHECK</div>
              <Dialog.Title style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                Execution Configuration
              </Dialog.Title>
              <Dialog.Description style={{ color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.55 }}>
                Configure noise and hardware before running the simulation.
              </Dialog.Description>
            </div>
            <div style={headerAccentStyle} />
          </div>

          {/* ── Divider ────────────────────────────────────────────────── */}
          <hr style={dividerStyle} />

          {/* ── Section 1: Noise Model ──────────────────────────────── */}
          <section style={sectionStyle}>
            <div style={sectionLabelStyle}>
              <Zap size={13} style={{ color: "var(--accent-cyan)", flexShrink: 0 }} />
              NOISE MODEL
            </div>

            <div style={noiseGridStyle}>
              {NOISE_OPTIONS.map((opt) => {
                const active = noiseModel === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    style={{
                      ...noiseOptionStyle,
                      borderColor: active ? "var(--accent-cyan)" : "var(--border)",
                      background: active ? "rgba(0,212,255,0.06)" : "var(--bg-card)",
                    }}
                    onClick={() => setNoiseModel(opt.value)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          ...radioDotStyle,
                          background: active ? "var(--accent-cyan)" : "transparent",
                          borderColor: active ? "var(--accent-cyan)" : "var(--border)",
                        }}
                      />
                      <span style={{ fontWeight: 600 }}>{opt.label}</span>
                    </div>
                    <span style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4, paddingLeft: 22 }}>
                      {opt.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Section 2: Circuit Complexity ──────────────────────── */}
          <section style={sectionStyle}>
            <div style={sectionLabelStyle}>
              <Cpu size={13} style={{ color: "var(--accent-cyan)", flexShrink: 0 }} />
              CIRCUIT COMPLEXITY
            </div>

            <div style={complexityCardStyle}>
              {/* Metrics row */}
              <div style={metricsRowStyle}>
                <MetricPill label="Gates" value={gateCount === 0 ? "—" : `${gateCount} Gates`} />
                <MetricPill label="Depth"  value={depth === 0    ? "—" : `Depth: ${depth}`}  />
                <MetricPill label="Qubits" value={`${nQubits} Qubits`} accent={nQubits > 12} />
              </div>

              {/* Complexity gauge */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, color: "var(--text-muted)" }}>
                  <span>Complexity</span>
                  <span style={{ color: gaugeColor, fontFamily: "var(--font-mono)" }}>{score}%</span>
                </div>
                <div style={gaugeTrackStyle}>
                  <div
                    style={{
                      ...gaugeFillStyle,
                      width: `${score}%`,
                      background: gaugeColor,
                      boxShadow: `0 0 8px ${gaugeColor}55`,
                    }}
                  />
                </div>
              </div>

              {/* Warning */}
              {isHighComplexity && (
                <div style={warningBannerStyle}>
                  <AlertTriangle size={13} style={{ flexShrink: 0, color: "var(--accent-amber)" }} />
                  <span>High complexity. GPU execution recommended.</span>
                </div>
              )}
            </div>
          </section>

          {/* ── Section 3: Compute Resource ─────────────────────────── */}
          <section style={sectionStyle}>
            <div style={sectionLabelStyle}>
              <Cpu size={13} style={{ color: "var(--accent-cyan)", flexShrink: 0 }} />
              COMPUTE RESOURCE
            </div>

            <div style={computeGridStyle}>
              {/* CPU button */}
              <ComputeToggle
                target="cpu"
                selected={computeTarget}
                onSelect={setComputeTarget}
                label={cpuLabel}
                sublabel={systemHardware ? `${systemHardware.cpu_cores} cores` : "Detected on launch"}
                disabled={false}
              />

              {/* GPU button */}
              <ComputeToggle
                target="gpu"
                selected={computeTarget}
                onSelect={setComputeTarget}
                label={gpuLabel}
                sublabel={
                  gpuAvailable
                    ? (systemHardware?.gpu_memory ?? "VRAM detected")
                    : undefined
                }
                disabled={!gpuAvailable}
                badge={gpuAvailable ? undefined : "No local GPU detected"}
              />
            </div>
          </section>

          {/* ── Action buttons ──────────────────────────────────────── */}
          <div style={actionRowStyle}>
            <Dialog.Close asChild>
              <button type="button" style={cancelButtonStyle}>
                Cancel
              </button>
            </Dialog.Close>

            <button type="button" style={runButtonStyle} onClick={handleConfirm}>
              <CheckCircle2 size={15} />
              Run Simulation
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={metricPillStyle}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>{label.toUpperCase()}</div>
      <div
        style={{
          marginTop: 4,
          fontWeight: 700,
          fontSize: 14,
          color: accent ? "var(--accent-amber)" : "var(--text-primary)",
        }}
      >
        {value}
      </div>
    </div>
  )
}

function ComputeToggle({
  target,
  selected,
  onSelect,
  label,
  sublabel,
  disabled,
  badge,
}: {
  target: ComputeTarget
  selected: ComputeTarget
  onSelect: (t: ComputeTarget) => void
  label: string
  sublabel?: string
  disabled: boolean
  badge?: string
}) {
  const active = selected === target && !disabled
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onSelect(target)}
      style={{
        ...computeToggleBase,
        borderColor: active ? "var(--accent-cyan)" : "var(--border)",
        background: active ? "rgba(0,212,255,0.07)" : "var(--bg-card)",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Cpu size={16} style={{ color: active ? "var(--accent-cyan)" : "var(--text-secondary)" }} />
        <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
      </div>
      {sublabel && (
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{sublabel}</span>
      )}
      {badge && (
        <span style={noBadgeStyle}>{badge}</span>
      )}
      {active && (
        <div style={activeIndicatorStyle} />
      )}
    </button>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 200,
  background: "rgba(5, 8, 18, 0.72)",
  backdropFilter: "blur(6px)",
}

const contentStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  margin: "auto",
  zIndex: 201,
  width: "min(580px, 94vw)",
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: "var(--radius-xl, 14px)",
  border: "1px solid var(--border)",
  background: "var(--bg-panel)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,212,255,0.07)",
  display: "flex",
  flexDirection: "column",
  padding: 0,
}

const headerStyle: CSSProperties = {
  padding: "24px 24px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
}

const headerAccentStyle: CSSProperties = {
  width: 4,
  height: 40,
  borderRadius: 2,
  background: "linear-gradient(180deg, var(--accent-cyan), rgba(0,212,255,0))",
  flexShrink: 0,
}

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  color: "var(--accent-cyan)",
  fontFamily: "var(--font-mono)",
  marginBottom: 6,
}

const dividerStyle: CSSProperties = {
  border: "none",
  borderTop: "1px solid var(--border)",
  margin: 0,
}

const sectionStyle: CSSProperties = {
  padding: "20px 24px 0",
}

const sectionLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  marginBottom: 12,
}

// Noise
const noiseGridStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const noiseOptionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: "11px 14px",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--border)",
  textAlign: "left",
  cursor: "pointer",
  transition: "border-color 0.15s, background 0.15s",
  color: "var(--text-primary)",
  fontSize: 13,
}

const radioDotStyle: CSSProperties = {
  width: 13,
  height: 13,
  borderRadius: "50%",
  border: "1.5px solid var(--border)",
  flexShrink: 0,
  transition: "background 0.12s, border-color 0.12s",
}

// Complexity
const complexityCardStyle: CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--border)",
  padding: "14px 16px",
}

const metricsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
}

const metricPillStyle: CSSProperties = {
  background: "var(--bg-active)",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--border)",
  padding: "10px 12px",
}

const gaugeTrackStyle: CSSProperties = {
  height: 6,
  borderRadius: 3,
  background: "var(--bg-active)",
  overflow: "hidden",
}

const gaugeFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: 3,
  transition: "width 0.4s ease, background 0.4s ease",
}

const warningBannerStyle: CSSProperties = {
  marginTop: 12,
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 10px",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--accent-amber)",
  background: "rgba(251,191,36,0.06)",
  color: "var(--accent-amber)",
  fontSize: 12,
}

// Compute
const computeGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
}

const computeToggleBase: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  padding: "14px 16px",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--border)",
  textAlign: "left",
  transition: "border-color 0.15s, background 0.15s, opacity 0.15s",
  minHeight: 80,
  overflow: "hidden",
  color: "var(--text-primary)",
}

const noBadgeStyle: CSSProperties = {
  marginTop: 6,
  display: "inline-block",
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--bg-active)",
  color: "var(--text-muted)",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
}

const activeIndicatorStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  left: 0,
  height: 2,
  background: "linear-gradient(90deg, transparent, var(--accent-cyan))",
  borderRadius: "8px 8px 0 0",
}

// Actions
const actionRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  padding: "20px 24px 24px",
  marginTop: 20,
}

const cancelButtonStyle: CSSProperties = {
  padding: "10px 20px",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-secondary)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
}

const runButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "10px 22px",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  color: "#000",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  boxShadow: "0 0 18px rgba(0,212,255,0.35)",
}
