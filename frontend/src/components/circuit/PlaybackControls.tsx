import { useEffect, useRef } from "react"
import { useCircuitStore } from "@/store/circuitStore"
import { useSimStore } from "@/store/simStore"
import { blochVector } from "@/lib/quantum/simulator"

export function PlaybackControls() {
  const { currentStep, setCurrentStep, isPlaying, setIsPlaying, nQubits } = useCircuitStore()
  const { snapshots, setResult, setEngineUsed } = useSimStore() as any
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const total = snapshots?.length ?? 0

  function seekTo(idx: number) {
    const snap = snapshots?.[idx]
    if (!snap) return
    const dim = 1 << nQubits
    setResult({
      stateVector: Array.from({ length: dim }, (_, i) => ({ re: snap.sv[2 * i], im: snap.sv[2 * i + 1] })),
      probabilities: Array.from(snap.probs),
      fidelity: 1.0,
      nQubits,
      shots: 0,
      blochVectors: nQubits <= 10
        ? Array.from({ length: nQubits }, (_, q) => blochVector(snap.sv, nQubits, q))
        : undefined,
    })
    setEngineUsed("local-wasm")
    setCurrentStep(idx)
  }

  useEffect(() => {
    if (!isPlaying || total <= 1) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      const prev = useCircuitStore.getState().currentStep
      const next = prev + 1
      if (next >= total - 1) { setIsPlaying(false); seekTo(total - 1) }
      else { seekTo(next) }
    }, 500)
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, total])

  if (total <= 1) return null

  return (
    <div style={{
      borderTop: "1px solid var(--border)", padding: "6px 14px",
      background: "var(--bg-secondary)", flexShrink: 0,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <button onClick={() => { setIsPlaying(false); seekTo(0) }} title="Reset" style={{
        fontSize: 13, color: "var(--text-muted)", padding: "2px 6px",
        border: "none", borderRadius: 3, background: "var(--bg-card)", cursor: "pointer",
      }}>⏮</button>
      <button onClick={() => setIsPlaying(!isPlaying)} style={{
        fontSize: 13, color: isPlaying ? "var(--accent-amber)" : "var(--accent-cyan)",
        padding: "2px 8px", border: `1px solid ${isPlaying ? "var(--accent-amber)" : "var(--accent-cyan)"}`,
        borderRadius: 3, background: "var(--bg-card)", minWidth: 30, cursor: "pointer",
      }}>
        {isPlaying ? "⏸" : "▶"}
      </button>
      <input type="range" min={0} max={total - 1} value={currentStep}
        onChange={e => { setIsPlaying(false); seekTo(Number(e.target.value)) }}
        style={{ flex: 1, accentColor: "var(--accent-cyan)" }}
      />
      <span style={{
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", minWidth: 60,
      }}>
        step {currentStep === 0 ? "init" : snapshots?.[currentStep]?.gateLabel ?? currentStep}
      </span>
    </div>
  )
}
