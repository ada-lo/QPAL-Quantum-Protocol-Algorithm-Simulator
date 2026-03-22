
import { useState, useMemo, useRef, useEffect } from "react"

// ── Grover exact simulation ──
function groverAmps(n: number, target: number, iter: number): number[] {
  const N = 1 << n
  const theta = Math.asin(1 / Math.sqrt(N))
  const angle = (2 * iter + 1) * theta
  return Array.from({ length: N }, (_, i) =>
    i === target ? Math.sin(angle) : Math.cos(angle) / Math.sqrt(N - 1)
  )
}

// ── Shor helpers ──
function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }
function classicalPeriod(a: number, N: number): number | null {
  let cur = a % N, r = 1
  while (cur !== 1 && r < 500) { cur = (cur * a) % N; r++ }
  return cur === 1 ? r : null
}

// ── QFT helper ──
function qftOutput(n: number, inputIdx: number) {
  const N = 1 << n
  return Array.from({ length: N }, (_, k) => {
    let re = 0, im = 0
    for (let j = 0; j < N; j++) {
      const amp = j === inputIdx ? 1 : 0
      re += amp * Math.cos(2 * Math.PI * j * k / N)
      im -= amp * Math.sin(2 * Math.PI * j * k / N)
    }
    return Math.sqrt(re*re + im*im) / Math.sqrt(N)
  })
}

// ── QAOA cost landscape ──
function qaoaCost(gamma: number, beta: number, edges: [number,number][]) {
  // Simplified QAOA expectation for MaxCut on small graphs
  let cost = 0
  for (const [u, v] of edges) {
    const angle = gamma * (u + v + 1) * 0.3
    cost += 0.5 * (1 - Math.cos(2*beta) * Math.sin(angle))
  }
  return cost / edges.length
}

const ALGORITHMS = [
  { id: "grover", label: "Grover's Search",        tag: "search",        tagColor: "var(--accent-cyan)" },
  { id: "shor",   label: "Shor's Factoring",        tag: "cryptography",  tagColor: "var(--accent-red)" },
  { id: "qft",    label: "Quantum Fourier Transform",tag: "subroutine",   tagColor: "var(--accent-purple)" },
  { id: "qaoa",   label: "QAOA",                    tag: "optimization",  tagColor: "var(--accent-amber)" },
  { id: "dj",     label: "Deutsch-Jozsa",           tag: "oracle",        tagColor: "#26A69A" },
  { id: "bv",     label: "Bernstein-Vazirani",      tag: "oracle",        tagColor: "#5C6BC0" },
  { id: "simon",  label: "Simon's Algorithm",       tag: "period",        tagColor: "#EF6C00" },
  { id: "qpe",    label: "Phase Estimation",         tag: "subroutine",   tagColor: "#AB47BC" },
  { id: "vqe",    label: "VQE",                     tag: "variational",   tagColor: "#E91E63" },
  { id: "qwalk",  label: "Quantum Walk",            tag: "graph",         tagColor: "#00897B" },
]

export function Algorithms() {
  const [algo, setAlgo] = useState("grover")
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{
        width: 200, flexShrink: 0, borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)",
          padding: "10px 14px 8px", borderBottom: "1px solid var(--border)",
        }}>ALGORITHMS</div>
        <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {ALGORITHMS.map(a => (
            <button key={a.id} onClick={() => setAlgo(a.id)} style={{
              textAlign: "left", padding: "9px 12px",
              borderRadius: "var(--radius-md)", transition: "all var(--transition)",
              background: algo === a.id ? "var(--bg-hover)" : "transparent",
              border: `1px solid ${algo === a.id ? a.tagColor : "transparent"}`,
              cursor: "pointer",
            }}>
              <div style={{
                fontSize: 12, fontWeight: algo === a.id ? 700 : 400,
                color: algo === a.id ? a.tagColor : "var(--text-primary)",
                marginBottom: 4,
              }}>{a.label}</div>
              <span style={{
                fontSize: 9, fontFamily: "var(--font-mono)",
                color: a.tagColor, padding: "1px 5px",
                background: `${a.tagColor}15`, borderRadius: 3,
                border: `1px solid ${a.tagColor}30`,
              }}>{a.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {algo === "grover" && <GroverExplorer />}
        {algo === "shor"   && <ShorExplorer />}
        {algo === "qft"    && <QFTExplorer />}
        {algo === "qaoa"   && <QAOAExplorer />}
        {algo === "dj"     && <DeutschJozsaExplorer />}
        {algo === "bv"     && <BernsteinVaziraniExplorer />}
        {algo === "simon"  && <SimonExplorer />}
        {algo === "qpe"    && <QPEExplorer />}
        {algo === "vqe"    && <VQEExplorer />}
        {algo === "qwalk"  && <QuantumWalkExplorer />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GROVER EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
function GroverExplorer() {
  const [n, setN]           = useState(3)
  const [target, setTarget] = useState(5)
  const [iter, setIter]     = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const N       = 1 << n
  const optIter = Math.max(1, Math.round(Math.PI / 4 * Math.sqrt(N)))
  const amps    = useMemo(() => groverAmps(n, target, iter), [n, target, iter])
  const probs   = amps.map(a => a * a)
  const pTarget = probs[target]
  const maxP    = Math.max(...probs)

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setIter(i => {
          if (i >= optIter * 2) { setPlaying(false); return 0 }
          return i + 1
        })
      }, 400)
    } else clearInterval(timerRef.current)
    return () => clearInterval(timerRef.current)
  }, [playing, optIter])

  // Update target when n changes
  useEffect(() => { setTarget(t => Math.min(t, N - 1)) }, [N])

  const barW = Math.max(6, Math.min(32, Math.floor(260 / N)))

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Grover's Search Algorithm</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7 }}>
          Finds a marked item in an unsorted database of N = 2ⁿ items using only <strong style={{ color: "var(--accent-cyan)" }}>O(√N)</strong> quantum queries —
          quadratic speedup over classical O(N). Each iteration applies an oracle (marks the target) followed by a diffusion operator (amplifies the target amplitude).
        </p>
      </div>

      {/* Controls row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          {
            label: "n qubits",
            sub: `N = ${N} states`,
            min: 2, max: 6, val: n,
            color: "var(--accent-blue)",
            set: (v: number) => { setN(v); setIter(0); setPlaying(false) },
          },
          {
            label: `target |${target}⟩`,
            sub: `range 0–${N-1}`,
            min: 0, max: N-1, val: target,
            color: "var(--accent-cyan)",
            set: (v: number) => { setTarget(v); setIter(0) },
          },
          {
            label: `iterations`,
            sub: `optimal = ${optIter}`,
            min: 0, max: optIter * 2, val: iter,
            color: iter === optIter ? "var(--accent-green)" : "var(--accent-amber)",
            set: (v: number) => { setIter(v); setPlaying(false) },
          },
        ].map(({ label, sub, min, max, val, color, set }) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color, fontWeight: 700 }}>{val}</span>
            </div>
            <input type="range" min={min} max={max} value={val}
              onChange={e => set(Number(e.target.value))}
              style={{ width: "100%", accentColor: color }}/>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Playback row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => { setIter(0); setPlaying(false) }} style={{
          padding: "4px 10px", fontSize: 12, borderRadius: "var(--radius-sm)",
          background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)",
        }}>⏮</button>
        <button onClick={() => setPlaying(v => !v)} style={{
          padding: "4px 14px", fontSize: 13, fontWeight: 700,
          borderRadius: "var(--radius-md)",
          background: playing ? "var(--accent-amber)" : "var(--accent-cyan)",
          color: "#000",
        }}>{playing ? "⏸ Pause" : "▶ Animate"}</button>
        <button onClick={() => setIter(optIter)} style={{
          padding: "4px 10px", fontSize: 11, borderRadius: "var(--radius-sm)",
          background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)",
        }}>Jump to optimal</button>
        {iter === optIter && (
          <span style={{ fontSize: 11, color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>
            ✓ Maximum amplitude
          </span>
        )}
      </div>

      {/* Amplitude histogram */}
      <div style={{
        background: "var(--bg-panel)", borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)", padding: "14px 16px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            PROBABILITY AMPLITUDES — iter {iter}
          </span>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>
            P(|{target}⟩) = {(pTarget * 100).toFixed(1)}%
          </span>
        </div>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 2,
          height: 90, overflowX: "auto", paddingBottom: 2,
        }}>
          {probs.map((p, i) => {
            const isTarget = i === target
            const amp = amps[i]
            const h = Math.max(2, Math.abs(p) * 86)
            const col = isTarget ? "var(--accent-cyan)"
                      : amp < 0  ? "var(--accent-red)"
                      : "var(--border-bright)"
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                {isTarget && (
                  <div style={{
                    fontSize: 8, color: "var(--accent-cyan)",
                    fontFamily: "var(--font-mono)", marginBottom: 1,
                  }}>★</div>
                )}
                <div style={{
                  width: barW, height: h,
                  background: col, borderRadius: "2px 2px 0 0",
                  boxShadow: isTarget ? `0 0 12px var(--accent-cyan)88` : "none",
                  transition: "height 0.25s ease",
                  flexShrink: 0,
                }}/>
                {N <= 16 && (
                  <span style={{
                    fontSize: 8, fontFamily: "var(--font-mono)",
                    color: isTarget ? "var(--accent-cyan)" : "var(--text-muted)",
                    writingMode: N > 8 ? "vertical-lr" : "horizontal-tb",
                  }}>{i}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Search space", value: `2^${n} = ${N}`,  color: "var(--text-primary)" },
          { label: "Classical",    value: `O(${N})`,         color: "var(--accent-red)" },
          { label: "Quantum",      value: `O(√${N}≈${Math.ceil(Math.sqrt(N))})`, color: "var(--accent-green)" },
          { label: "Speedup",      value: `${Math.floor(N/Math.ceil(Math.sqrt(N)))}×`, color: "var(--accent-cyan)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "var(--bg-card)", borderRadius: "var(--radius-md)",
            padding: "10px 12px", border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Amplitude evolution chart */}
      <AmpEvolutionChart n={n} target={target} optIter={optIter} currentIter={iter} />
    </div>
  )
}

function AmpEvolutionChart({ n, target, optIter, currentIter }: {
  n: number; target: number; optIter: number; currentIter: number
}) {
  const W = 560, H = 80
  const PAD = { top: 8, right: 12, bottom: 20, left: 32 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom
  const maxI = optIter * 2

  const targetPts = Array.from({ length: maxI + 1 }, (_, i) => {
    const a = groverAmps(n, target, i)
    return a[target] ** 2
  })
  const otherPts = Array.from({ length: maxI + 1 }, (_, i) => {
    const a = groverAmps(n, target, i)
    const others = a.filter((_, idx) => idx !== target)
    return Math.max(...others.map(x => x*x))
  })

  const toX = (i: number) => PAD.left + (i / maxI) * iW
  const toY = (p: number) => PAD.top + (1 - p) * iH

  const tPath = targetPts.map((p, i) => `${i===0?"M":"L"}${toX(i).toFixed(1)},${toY(p).toFixed(1)}`).join(" ")
  const oPath = otherPts.map((p, i) => `${i===0?"M":"L"}${toX(i).toFixed(1)},${toY(p).toFixed(1)}`).join(" ")

  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
        AMPLITUDE EVOLUTION over iterations
      </div>
      <svg width={W} height={H} style={{ display: "block" }}>
        {/* Grid */}
        {[0, 0.5, 1].map(f => (
          <line key={f} x1={PAD.left} x2={W-PAD.right} y1={toY(f)} y2={toY(f)}
            stroke="var(--border)" strokeWidth={0.5}/>
        ))}
        {[0, 0.5, 1].map(f => (
          <text key={f} x={PAD.left-4} y={toY(f)+3} fontSize={7}
            fill="var(--text-muted)" textAnchor="end" fontFamily="var(--font-mono)">{f.toFixed(1)}</text>
        ))}
        <line x1={PAD.left} x2={W-PAD.right} y1={H-PAD.bottom} y2={H-PAD.bottom}
          stroke="var(--border)" strokeWidth={0.5}/>

        {/* Other states curve */}
        <path d={oPath} fill="none" stroke="var(--border-bright)" strokeWidth={1} opacity={0.6}/>

        {/* Target curve */}
        <path d={tPath} fill="none" stroke="var(--accent-cyan)" strokeWidth={2}/>

        {/* Current iter marker */}
        <line
          x1={toX(currentIter)} y1={PAD.top}
          x2={toX(currentIter)} y2={H-PAD.bottom}
          stroke="var(--accent-amber)" strokeWidth={1} strokeDasharray="3,2"/>

        {/* Optimal marker */}
        <line
          x1={toX(optIter)} y1={PAD.top}
          x2={toX(optIter)} y2={H-PAD.bottom}
          stroke="var(--accent-green)" strokeWidth={0.8} strokeDasharray="2,2" opacity={0.7}/>
        <text x={toX(optIter)} y={PAD.top-1} fontSize={7}
          fill="var(--accent-green)" textAnchor="middle" fontFamily="var(--font-mono)">opt</text>

        {/* Labels */}
        <text x={W-PAD.right+2} y={toY(targetPts[maxI])+3} fontSize={7}
          fill="var(--accent-cyan)" fontFamily="var(--font-mono)">target</text>
        <text x={W-PAD.right+2} y={toY(otherPts[maxI])+3} fontSize={7}
          fill="var(--text-muted)" fontFamily="var(--font-mono)">other</text>
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOR EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
function ShorExplorer() {
  const [N, setN] = useState(15)
  const [a, setA] = useState(2)
  const candidates = [15, 21, 35, 77, 91]

  const coprime = gcd(a, N) === 1
  const r       = coprime ? classicalPeriod(a, N) : null
  const rEven   = r !== null && r % 2 === 0
  const x       = rEven ? Math.pow(a, r!/2) % N : null
  const f1      = x !== null ? gcd(x + 1, N) : null
  const f2      = x !== null ? gcd(x - 1, N) : null
  const success = f1 !== null && f2 !== null && f1 > 1 && f2 > 1 && f1 * f2 === N

  const qubitsNeeded = Math.ceil(2 * Math.log2(N)) + 3

  const steps = [
    {
      label: "Pick random a",
      done: true,
      content: (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[2,3,4,5,6,7].map(v => (
            <button key={v} onClick={() => setA(v)} disabled={gcd(v,N)!==1} style={{
              width: 28, height: 28, borderRadius: "var(--radius-sm)", fontSize: 12,
              fontFamily: "var(--font-mono)", fontWeight: a===v?700:400,
              background: a===v?"var(--accent-cyan)":"var(--bg-hover)",
              color: a===v?"#000":gcd(v,N)===1?"var(--text-primary)":"var(--text-muted)",
              border: `1px solid ${a===v?"var(--accent-cyan)":"var(--border)"}`,
              opacity: gcd(v,N)!==1?0.4:1, cursor: gcd(v,N)!==1?"not-allowed":"pointer",
            }}>{v}</button>
          ))}
        </div>
      ),
    },
    {
      label: "Check gcd(a, N)",
      done: coprime,
      content: <code style={{ fontSize: 12, color: coprime?"var(--accent-green)":"var(--accent-red)" }}>
        gcd({a}, {N}) = {gcd(a, N)} {coprime?"✓ coprime":"✗ retry"}
      </code>,
    },
    {
      label: "Quantum period finding",
      done: r !== null,
      quantum: true,
      content: (
        <div>
          <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: r?"var(--accent-cyan)":"var(--text-muted)" }}>
            {r ? `r = ${r}  (${a}^${r} mod ${N} = 1)` : "No period found — try different a"}
          </div>
          {r && (
            <div style={{ marginTop: 6, overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {Array.from({ length: Math.min(r * 2, 14) }, (_, i) => {
                  const val = Math.pow(a, i) % N
                  const isOne = val === 1 && i > 0
                  return (
                    <div key={i} style={{ flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 22, borderRadius: 3, fontSize: 10,
                        fontFamily: "var(--font-mono)", fontWeight: isOne?700:400,
                        background: isOne?"rgba(0,212,255,0.15)":"var(--bg-card)",
                        border: `1px solid ${isOne?"var(--accent-cyan)":"var(--border)"}`,
                        color: isOne?"var(--accent-cyan)":"var(--text-secondary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{val}</div>
                      <div style={{ fontSize: 7, color: "var(--text-muted)", textAlign: "center", marginTop: 1 }}>{i}</div>
                    </div>
                  )
                })}
                {r * 2 > 14 && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>…</span>}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Check r is even",
      done: rEven,
      content: <code style={{ fontSize: 12, color: rEven?"var(--accent-green)":"var(--accent-amber)" }}>
        {r !== null ? `r = ${r} is ${r%2===0?"even ✓":"odd — retry with different a"}` : "—"}
      </code>,
    },
    {
      label: `Compute gcd(a^(r/2) ± 1, N)`,
      done: success,
      content: x !== null ? (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          <div style={{ color: "var(--text-secondary)" }}>a^(r/2) mod N = {a}^{r!/2} mod {N} = {x}</div>
          <div style={{ color: success?"var(--accent-green)":"var(--accent-red)", marginTop: 4, fontWeight: 700 }}>
            gcd({x}+1, {N}) = {f1} &nbsp;·&nbsp; gcd({x}-1, {N}) = {f2}
            {success ? ` = ${N} ✓` : " — retry"}
          </div>
        </div>
      ) : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>,
    },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 680 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Shor's Factoring Algorithm</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        Factors N in polynomial time using quantum period finding. Breaks RSA encryption.
        The quantum step (period finding via QFT) provides exponential speedup over best classical algorithms.
      </p>

      {/* N selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Factor N =</span>
        {candidates.map(n => (
          <button key={n} onClick={() => { setN(n); setA(2) }} style={{
            padding: "5px 14px", borderRadius: "var(--radius-md)", fontSize: 13,
            fontWeight: N===n?700:400, fontFamily: "var(--font-mono)",
            background: N===n?"var(--accent-cyan)":"var(--bg-card)",
            color: N===n?"#000":"var(--text-secondary)",
            border: `1px solid ${N===n?"var(--accent-cyan)":"var(--border)"}`,
          }}>{n}</button>
        ))}
      </div>

      {/* Hardware requirements */}
      <div style={{
        padding: "8px 14px", marginBottom: 20,
        background: "rgba(239,68,68,0.06)", borderRadius: "var(--radius-md)",
        border: "1px solid rgba(239,68,68,0.2)", fontSize: 11,
        color: "var(--text-secondary)",
      }}>
        <span style={{ color: "var(--accent-red)", fontWeight: 600 }}>Hardware needed: </span>
        ~{qubitsNeeded} logical qubits for N={N}. RSA-2048 would require ~4,000 logical / ~4M physical qubits.
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            padding: "10px 14px", borderRadius: "var(--radius-md)",
            background: "var(--bg-card)",
            border: `1px solid ${step.done ? "var(--border)" : "var(--border)"}`,
            opacity: step.done || i === steps.findIndex(s => !s.done) ? 1 : 0.5,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: step.content ? 8 : 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: step.done ? "var(--accent-green)" : "var(--bg-hover)",
                border: `1.5px solid ${step.done ? "var(--accent-green)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: step.done ? "#000" : "var(--text-muted)",
              }}>{step.done ? "✓" : i+1}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                {step.label}
              </span>
              {(step as any).quantum && (
                <span style={{
                  fontSize: 9, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)",
                  padding: "1px 5px", background: "rgba(0,212,255,0.1)",
                  borderRadius: 3, border: "1px solid rgba(0,212,255,0.2)",
                }}>QUANTUM</span>
              )}
            </div>
            {step.content && <div style={{ marginLeft: 32 }}>{step.content}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QFT EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
function QFTExplorer() {
  const [n, setN]     = useState(3)
  const [input, setInput] = useState(1)
  const N = 1 << n
  const mags = useMemo(() => qftOutput(n, input), [n, input])

  const maxMag = Math.max(...mags)
  const W = 500, H = 90
  const PAD = { top: 8, right: 16, bottom: 20, left: 8 }
  const barW = Math.max(4, Math.floor((W - PAD.left - PAD.right) / N) - 2)

  return (
    <div style={{ padding: 24, maxWidth: 680 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Quantum Fourier Transform</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        The quantum analogue of the DFT, computed in <strong style={{ color: "var(--accent-purple)" }}>O(n²)</strong> gates instead of classical O(N log N).
        Core subroutine of Shor's algorithm and quantum phase estimation.
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ minWidth: 160 }}>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Qubits (N = 2ⁿ)</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[2,3,4,5].map(v => (
              <button key={v} onClick={() => { setN(v); setInput(0) }} style={{
                padding: "4px 10px", borderRadius: "var(--radius-sm)", fontSize: 12,
                background: n===v?"var(--accent-purple)":"var(--bg-card)",
                color: n===v?"#fff":"var(--text-secondary)",
                border: `1px solid ${n===v?"var(--accent-purple)":"var(--border)"}`,
              }}>n={v}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Input state |{input}⟩</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent-purple)", fontWeight: 700 }}>{input}</span>
          </div>
          <input type="range" min={0} max={N-1} value={input}
            onChange={e => setInput(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent-purple)" }}/>
        </div>
      </div>

      {/* Input / Output display */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "start", marginBottom: 20 }}>
        {/* Input */}
        <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: 14 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 10 }}>
            INPUT |{input}⟩
          </div>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 50 }}>
            {Array.from({ length: N }, (_, i) => (
              <div key={i} style={{
                flex: 1, height: i === input ? 46 : 2,
                background: i === input ? "var(--accent-blue)" : "var(--border-bright)",
                borderRadius: "2px 2px 0 0",
              }}/>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 24, color: "var(--accent-purple)", paddingTop: 28 }}>→</div>
        {/* Output */}
        <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: 14 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 10 }}>
            QFT OUTPUT
          </div>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 50 }}>
            {mags.map((m, i) => {
              const h = maxMag > 0 ? Math.max(2, (m / maxMag) * 46) : 2
              return (
                <div key={i} style={{
                  flex: 1, height: h,
                  background: `hsl(${200 + i * (140/N)}, 80%, 60%)`,
                  borderRadius: "2px 2px 0 0",
                  transition: "height 0.3s",
                }}/>
              )
            })}
          </div>
        </div>
      </div>

      {/* Phase wheel */}
      <div style={{
        padding: "12px 14px", background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", fontSize: 12,
        color: "var(--text-secondary)", lineHeight: 1.7,
      }}>
        <span style={{ color: "var(--accent-purple)", fontWeight: 700 }}>Key insight: </span>
        QFT maps |{input}⟩ to a uniform superposition with frequency-{input} phase rotation.
        Each output amplitude has magnitude 1/√{N} but different phases — exactly what Shor's algorithm uses
        to detect periodicity.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QAOA EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
const GRAPH_EDGES: [number,number][] = [[0,1],[1,2],[2,3],[3,0],[0,2]]

function QAOAExplorer() {
  const [gamma, setGamma] = useState(0.8)
  const [beta,  setBeta]  = useState(0.4)

  // Sample cost landscape
  const landscape = useMemo(() => {
    const res = 30
    return Array.from({ length: res }, (_, gi) => {
      const g = (gi / (res-1)) * Math.PI
      return Array.from({ length: res }, (_, bi) => {
        const b = (bi / (res-1)) * (Math.PI / 2)
        return qaoaCost(g, b, GRAPH_EDGES)
      })
    })
  }, [])

  const currentCost = qaoaCost(gamma, beta, GRAPH_EDGES)
  const maxCost = Math.max(...landscape.flat())
  const res = landscape.length

  return (
    <div style={{ padding: 24, maxWidth: 680 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
        QAOA — Quantum Approximate Optimization
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        A variational quantum algorithm for combinatorial optimization (e.g. MaxCut).
        Alternates between a problem-encoding unitary (γ) and a mixing unitary (β).
        The parameters are classically optimized to maximize the cost function expectation.
      </p>

      {/* Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[
          { label: "γ (problem unitary)", val: gamma, max: Math.PI, color: "var(--accent-amber)", set: setGamma },
          { label: "β (mixing unitary)",  val: beta,  max: Math.PI/2, color: "var(--accent-purple)", set: setBeta },
        ].map(({ label, val, max, color, set }) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</span>
              <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color, fontWeight: 700 }}>
                {val.toFixed(2)}
              </span>
            </div>
            <input type="range" min={0} max={max} step={0.02} value={val}
              onChange={e => set(Number(e.target.value))}
              style={{ width: "100%", accentColor: color }}/>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Heatmap */}
        <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: 14 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
            COST LANDSCAPE F(γ, β)
          </div>
          <CostHeatmap landscape={landscape} gamma={gamma} beta={beta} maxCost={maxCost} />
        </div>

        {/* Graph */}
        <div style={{ background: "var(--bg-panel)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: 14 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
            MAXCUT GRAPH
          </div>
          <MaxCutGraph edges={GRAPH_EDGES} />
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Expected cut: </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-amber)", fontFamily: "var(--font-mono)" }}>
              {currentCost.toFixed(3)}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>/ 1.0 max</span>
          </div>
        </div>
      </div>

      <div style={{
        padding: "10px 14px", background: "var(--bg-card)",
        borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: 12,
        color: "var(--text-secondary)", lineHeight: 1.7,
      }}>
        <span style={{ color: "var(--accent-amber)", fontWeight: 700 }}>Key insight: </span>
        Drag γ and β to find the maximum of the cost landscape. A classical optimizer (COBYLA, BFGS)
        does this automatically on a quantum computer. Deeper circuits (more layers p) approach the exact solution.
      </div>
    </div>
  )
}

function CostHeatmap({ landscape, gamma, beta, maxCost }: {
  landscape: number[][], gamma: number, beta: number, maxCost: number
}) {
  const res = landscape.length
  const size = 140
  const cellSize = size / res

  const gx = (gamma / Math.PI) * size
  const by = (beta / (Math.PI/2)) * size

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <canvas ref={(c) => {
        if (!c) return
        const ctx = c.getContext("2d")!
        c.width = size; c.height = size
        for (let gi = 0; gi < res; gi++) {
          for (let bi = 0; bi < res; bi++) {
            const v = landscape[gi][bi] / maxCost
            const r = Math.round(10 + v * 180)
            const g = Math.round(10 + v * 100)
            const b = Math.round(10 + (1-v) * 80)
            ctx.fillStyle = `rgb(${r},${g},${b})`
            ctx.fillRect(gi * cellSize, bi * cellSize, cellSize, cellSize)
          }
        }
      }} style={{ display: "block" }}/>
      {/* Current position crosshair */}
      <svg style={{ position: "absolute", inset: 0 }} width={size} height={size}>
        <line x1={gx} y1={0} x2={gx} y2={size} stroke="white" strokeWidth={0.8} opacity={0.7}/>
        <line x1={0} y1={by} x2={size} y2={by} stroke="white" strokeWidth={0.8} opacity={0.7}/>
        <circle cx={gx} cy={by} r={4} fill="white" stroke="var(--accent-amber)" strokeWidth={1.5}/>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 8, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>γ=0</span>
        <span style={{ fontSize: 8, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>γ=π</span>
      </div>
    </div>
  )
}

function MaxCutGraph({ edges }: { edges: [number,number][] }) {
  const n = Math.max(...edges.flat()) + 1
  const cx = 60, cy = 60, r = 44
  const pts = Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((i / n) * Math.PI * 2 - Math.PI/2),
    y: cy + r * Math.sin((i / n) * Math.PI * 2 - Math.PI/2),
  }))
  return (
    <svg width={120} height={120} style={{ display: "block", margin: "0 auto" }}>
      {edges.map(([u, v], i) => (
        <line key={i}
          x1={pts[u].x} y1={pts[u].y} x2={pts[v].x} y2={pts[v].y}
          stroke="var(--accent-amber)" strokeWidth={1.5} opacity={0.7}/>
      ))}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={10} fill="var(--bg-card)" stroke="var(--accent-amber)" strokeWidth={1.5}/>
          <text x={p.x} y={p.y+4} textAnchor="middle" fontSize={10}
            fill="var(--accent-amber)" fontFamily="var(--font-mono)" fontWeight={700}>{i}</text>
        </g>
      ))}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEUTSCH-JOZSA EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
function deutschJozsaOracle(n: number, type: 'constant' | 'balanced', seed: number): (0 | 1)[] {
  const N = 1 << n
  if (type === 'constant') return Array(N).fill((seed % 2) as 0 | 1)
  // Balanced: exactly half zeros, half ones
  const arr: (0 | 1)[] = Array.from({ length: N }, (_, i) => (i < N / 2 ? 0 : 1))
  // Deterministic shuffle based on seed
  for (let i = arr.length - 1; i > 0; i--) {
    const j = ((seed * 31 + i * 17) % (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function DeutschJozsaExplorer() {
  const [n, setN] = useState(3)
  const [type, setType] = useState<'constant' | 'balanced'>('balanced')
  const [seed, setSeed] = useState(42)
  const [revealed, setRevealed] = useState(false)

  const N = 1 << n
  const oracle = useMemo(() => deutschJozsaOracle(n, type, seed), [n, type, seed])

  // Simulate DJ algorithm
  const result = useMemo(() => {
    // After H⊗n → Oracle → H⊗n, measure.
    // If constant → all zeros; if balanced → non-zero
    const amps = new Array(N).fill(0)
    // Apply Hadamard to |0...0⟩, oracle, Hadamard
    for (let x = 0; x < N; x++) {
      let amp = 0
      for (let y = 0; y < N; y++) {
        const phase = oracle[y] === 1 ? -1 : 1
        // (-1)^(x·y ⊕ f(y))
        let dot = 0
        for (let k = 0; k < n; k++) dot += ((x >> k) & 1) * ((y >> k) & 1)
        amp += (dot % 2 === 0 ? 1 : -1) * phase
      }
      amps[x] = amp / N
    }
    return amps
  }, [oracle, N, n])

  const probs = result.map(a => a * a)
  const isConstant = probs[0] > 0.99

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Deutsch-Jozsa Algorithm</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        Determines if a function is <strong style={{ color: "#26A69A" }}>constant</strong> (same output for all inputs) or{' '}
        <strong style={{ color: "#EF6C00" }}>balanced</strong> (outputs 0 for half, 1 for half) with a{' '}
        <strong style={{ color: "#26A69A" }}>single quantum query</strong> — exponential speedup over classical O(2<sup>n-1</sup>+1).
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Qubits</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[2, 3, 4, 5].map(v => (
              <button key={v} onClick={() => { setN(v); setRevealed(false) }} style={{
                padding: "4px 10px", borderRadius: 4, fontSize: 12,
                background: n === v ? "#26A69A" : "var(--bg-card)",
                color: n === v ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${n === v ? "#26A69A" : "var(--border)"}`,
              }}>n={v}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Oracle type</div>
          <div style={{ display: "flex", gap: 4 }}>
            {(['constant', 'balanced'] as const).map(t => (
              <button key={t} onClick={() => { setType(t); setRevealed(false) }} style={{
                padding: "4px 14px", borderRadius: 4, fontSize: 12, textTransform: "capitalize",
                background: type === t ? (t === 'constant' ? "#26A69A" : "#EF6C00") : "var(--bg-card)",
                color: type === t ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${type === t ? (t === 'constant' ? "#26A69A" : "#EF6C00") : "var(--border)"}`,
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Seed</div>
          <input type="range" min={0} max={100} value={seed}
            onChange={e => { setSeed(Number(e.target.value)); setRevealed(false) }}
            style={{ width: 100, accentColor: "#26A69A" }} />
        </div>
      </div>

      {/* Circuit diagram */}
      <div style={{
        padding: "12px 16px", background: "var(--bg-panel)", borderRadius: 8,
        border: "1px solid var(--border)", marginBottom: 16, fontFamily: "var(--font-mono)",
        fontSize: 12, color: "var(--text-secondary)", lineHeight: 2,
      }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 8 }}>CIRCUIT</div>
        {Array.from({ length: n }, (_, i) => (
          <div key={i}>|0⟩ ─── H ─── {i === n - 1 ? "Oracle" : "  ·  "} ─── H ─── M</div>
        ))}
      </div>

      {/* Result */}
      <button onClick={() => setRevealed(true)} style={{
        padding: "6px 18px", borderRadius: 6, fontSize: 13, fontWeight: 700,
        background: revealed ? "var(--bg-card)" : "#26A69A", color: revealed ? "var(--text-secondary)" : "#fff",
        border: `1px solid ${revealed ? "var(--border)" : "#26A69A"}`, marginBottom: 16,
      }}>{revealed ? "✓ Measured" : "▶ Run & Measure"}</button>

      {revealed && (
        <div style={{
          padding: "12px 16px", borderRadius: 8,
          background: isConstant ? "rgba(38,166,154,0.08)" : "rgba(239,108,0,0.08)",
          border: `1px solid ${isConstant ? "rgba(38,166,154,0.3)" : "rgba(239,108,0,0.3)"}`,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: isConstant ? "#26A69A" : "#EF6C00", marginBottom: 6 }}>
            {isConstant ? "CONSTANT — measured |0...0⟩" : "BALANCED — measured non-zero"}
          </div>
          <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 50 }}>
            {probs.slice(0, Math.min(32, N)).map((p, i) => (
              <div key={i} style={{
                width: Math.max(4, Math.floor(200 / N)),
                height: Math.max(1, p * 48), borderRadius: "2px 2px 0 0",
                background: i === 0 ? "#26A69A" : p > 0.01 ? "#EF6C00" : "var(--border-bright)",
                transition: "height 0.3s",
              }} />
            ))}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
            P(|0...0⟩) = {(probs[0] * 100).toFixed(1)}% — only 1 query used (classical needs {(N / 2 + 1)})
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BERNSTEIN-VAZIRANI EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
function BernsteinVaziraniExplorer() {
  const [n, setN] = useState(4)
  const [secret, setSecret] = useState(5)  // hidden string s
  const [revealed, setRevealed] = useState(false)

  const N = 1 << n
  const secretBits = Array.from({ length: n }, (_, k) => (secret >> k) & 1).reverse()

  // BV result: After H→Oracle(s)→H→Measure, we get |s⟩ directly
  const resultBits = useMemo(() => {
    // The algorithm directly outputs s
    return Array.from({ length: n }, (_, k) => (secret >> k) & 1).reverse()
  }, [secret, n])

  useEffect(() => { setSecret(s => s % N) }, [N])

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Bernstein-Vazirani Algorithm</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        Finds a hidden string <strong style={{ color: "#5C6BC0" }}>s</strong> in f(x) = s·x mod 2 with a{' '}
        <strong style={{ color: "#5C6BC0" }}>single query</strong>. Classically requires n queries.
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Qubits</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[3, 4, 5, 6].map(v => (
              <button key={v} onClick={() => { setN(v); setSecret(s => s % (1 << v)); setRevealed(false) }} style={{
                padding: "4px 10px", borderRadius: 4, fontSize: 12,
                background: n === v ? "#5C6BC0" : "var(--bg-card)",
                color: n === v ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${n === v ? "#5C6BC0" : "var(--border)"}`,
              }}>n={v}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Hidden string s</span>
            <span style={{
              fontSize: 12, fontFamily: "var(--font-mono)", color: "#5C6BC0", fontWeight: 700,
            }}>s = {secretBits.join('')}</span>
          </div>
          <input type="range" min={0} max={N - 1} value={secret}
            onChange={e => { setSecret(Number(e.target.value)); setRevealed(false) }}
            style={{ width: 180, accentColor: "#5C6BC0" }} />
        </div>
      </div>

      {/* Oracle truth table */}
      <div style={{
        padding: "10px 14px", background: "var(--bg-panel)", borderRadius: 8,
        border: "1px solid var(--border)", marginBottom: 16,
      }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
          ORACLE f(x) = s·x mod 2 — showing first {Math.min(8, N)} of {N} values
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Array.from({ length: Math.min(8, N) }, (_, x) => {
            let dot = 0
            for (let k = 0; k < n; k++) dot += ((secret >> k) & 1) * ((x >> k) & 1)
            const fx = dot % 2
            return (
              <div key={x} style={{
                padding: "4px 8px", borderRadius: 4, fontSize: 10,
                fontFamily: "var(--font-mono)", background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}>
                f({x.toString(2).padStart(n, '0')}) = <span style={{ color: fx ? "#EF5350" : "#66BB6A", fontWeight: 700 }}>{fx}</span>
              </div>
            )
          })}
          {N > 8 && <span style={{ fontSize: 10, color: "var(--text-muted)", alignSelf: "center" }}>…</span>}
        </div>
      </div>

      <button onClick={() => setRevealed(true)} style={{
        padding: "6px 18px", borderRadius: 6, fontSize: 13, fontWeight: 700,
        background: revealed ? "var(--bg-card)" : "#5C6BC0", color: revealed ? "var(--text-secondary)" : "#fff",
        border: `1px solid ${revealed ? "var(--border)" : "#5C6BC0"}`, marginBottom: 16,
      }}>{revealed ? "✓ String found" : "▶ Run Algorithm"}</button>

      {revealed && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, background: "rgba(92,107,192,0.08)",
          border: "1px solid rgba(92,107,192,0.3)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#5C6BC0", marginBottom: 8 }}>
            Hidden string recovered: s = {resultBits.join('')}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {resultBits.map((b, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: 4,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)",
                background: b ? "#5C6BC0" : "var(--bg-card)",
                color: b ? "#fff" : "var(--text-muted)",
                border: `1px solid ${b ? "#5C6BC0" : "var(--border)"}`,
              }}>{b}</div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, fontFamily: "var(--font-mono)" }}>
            1 quantum query vs {n} classical queries
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMON'S ALGORITHM EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
function SimonExplorer() {
  const [n, setN] = useState(3)
  const [sIdx, setSIdx] = useState(3)  // Simon's period index

  const N = 1 << n
  const period = sIdx // period (s value)
  const periodBits = Array.from({ length: n }, (_, k) => (period >> k) & 1).reverse()

  // Build Simon's oracle: 2-to-1 function with f(x) = f(x ⊕ s)
  const oracleValues = useMemo(() => {
    const vals = new Map<number, number>()
    let nextVal = 0
    for (let x = 0; x < N; x++) {
      const xXorS = x ^ period
      if (vals.has(xXorS)) {
        vals.set(x, vals.get(xXorS)!)
      } else {
        vals.set(x, nextVal++)
      }
    }
    return vals
  }, [N, period])

  // Simulate collected equations from Simon's iterations
  const equations = useMemo(() => {
    const eqs: number[][] = []
    // Simon's finds y such that y·s = 0 mod 2
    for (let y = 0; y < N; y++) {
      let dot = 0
      for (let k = 0; k < n; k++) dot += ((y >> k) & 1) * ((period >> k) & 1)
      if (dot % 2 === 0 && y !== 0) {
        eqs.push(Array.from({ length: n }, (_, k) => (y >> k) & 1).reverse())
      }
    }
    return eqs.slice(0, n)
  }, [N, n, period])

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Simon's Algorithm</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        Finds hidden period <strong style={{ color: "#EF6C00" }}>s</strong> of a 2-to-1 function where f(x) = f(x ⊕ s).
        Exponential speedup: <strong style={{ color: "#EF6C00" }}>O(n)</strong> quantum queries vs O(2<sup>n/2</sup>) classical.
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>n</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[2, 3, 4].map(v => (
              <button key={v} onClick={() => { setN(v); setSIdx(s => Math.min(s, (1 << v) - 1)) }} style={{
                padding: "4px 10px", borderRadius: 4, fontSize: 12,
                background: n === v ? "#EF6C00" : "var(--bg-card)",
                color: n === v ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${n === v ? "#EF6C00" : "var(--border)"}`,
              }}>{v}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Period s</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#EF6C00", fontWeight: 700 }}>
              {periodBits.join('')}
            </span>
          </div>
          <input type="range" min={1} max={N - 1} value={sIdx}
            onChange={e => setSIdx(Number(e.target.value))}
            style={{ width: 160, accentColor: "#EF6C00" }} />
        </div>
      </div>

      {/* Function table */}
      <div style={{
        padding: "10px 14px", background: "var(--bg-panel)", borderRadius: 8,
        border: "1px solid var(--border)", marginBottom: 16,
      }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
          f(x) — 2-to-1 with f(x) = f(x ⊕ {periodBits.join('')})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(8, N)}, 1fr)`, gap: 4 }}>
          {Array.from({ length: Math.min(8, N) }, (_, x) => (
            <div key={x} style={{
              textAlign: "center", padding: "4px 2px", borderRadius: 4,
              background: "var(--bg-card)", border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 8, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {x.toString(2).padStart(n, '0')}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#EF6C00" }}>
                {oracleValues.get(x)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equations */}
      <div style={{
        padding: "10px 14px", background: "var(--bg-panel)", borderRadius: 8,
        border: "1px solid var(--border)", marginBottom: 16,
      }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
          COLLECTED EQUATIONS y·s = 0 mod 2
        </div>
        {equations.map((eq, i) => (
          <div key={i} style={{
            fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: 4,
          }}>
            {eq.map((b, j) => `${b}·s${j}`).join(' + ')} ≡ 0 (mod 2)
          </div>
        ))}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#EF6C00", marginTop: 8 }}>
          → s = {periodBits.join('')}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QPE EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
function QPEExplorer() {
  const [precision, setPrecision] = useState(4)
  const [targetPhase, setTargetPhase] = useState(0.25) // θ in U|ψ⟩ = e^{2πiθ}|ψ⟩

  const N = 1 << precision

  // QPE result: peak at k ≈ θ * 2^n
  const probs = useMemo(() => {
    return Array.from({ length: N }, (_, k) => {
      // |1/N * Σ_{j=0}^{N-1} e^{2πi(θ-k/N)j}|²
      const delta = targetPhase - k / N
      if (Math.abs(delta * N) < 1e-10) return 1.0
      const sinNpd = Math.sin(Math.PI * delta * N)
      const sinpd = Math.sin(Math.PI * delta)
      return Math.abs(sinpd) < 1e-14 ? 1.0 : (sinNpd / (N * sinpd)) ** 2
    })
  }, [precision, targetPhase, N])

  const bestK = probs.indexOf(Math.max(...probs))
  const estimatedPhase = bestK / N

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Quantum Phase Estimation</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        Estimates the phase θ in U|ψ⟩ = e<sup>2πiθ</sup>|ψ⟩ to n bits of precision.
        Core subroutine of <strong style={{ color: "#AB47BC" }}>Shor's algorithm</strong> and quantum chemistry.
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Precision bits</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[3, 4, 5, 6, 8].map(v => (
              <button key={v} onClick={() => setPrecision(v)} style={{
                padding: "4px 10px", borderRadius: 4, fontSize: 12,
                background: precision === v ? "#AB47BC" : "var(--bg-card)",
                color: precision === v ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${precision === v ? "#AB47BC" : "var(--border)"}`,
              }}>n={v}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Target phase θ</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#AB47BC", fontWeight: 700 }}>
              {targetPhase.toFixed(4)}
            </span>
          </div>
          <input type="range" min={0} max={1} step={0.001} value={targetPhase}
            onChange={e => setTargetPhase(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#AB47BC" }} />
        </div>
      </div>

      {/* Probability distribution */}
      <div style={{
        padding: "14px 16px", background: "var(--bg-panel)", borderRadius: 8,
        border: "1px solid var(--border)", marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            MEASUREMENT PROBABILITIES
          </span>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#AB47BC" }}>
            estimated θ ≈ {estimatedPhase.toFixed(precision)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 80 }}>
          {probs.slice(0, Math.min(64, N)).map((p, k) => (
            <div key={k} style={{
              flex: 1, height: Math.max(1, p * 76), borderRadius: "2px 2px 0 0",
              background: k === bestK ? "#AB47BC" : p > 0.01 ? "#7B1FA2" : "var(--border-bright)",
              transition: "height 0.3s",
              boxShadow: k === bestK ? "0 0 8px rgba(171,71,188,0.5)" : "none",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 7, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>k=0</span>
          <span style={{ fontSize: 7, fontFamily: "var(--font-mono)", color: "#AB47BC" }}>↑ k={bestK} → θ≈{estimatedPhase.toFixed(4)}</span>
          <span style={{ fontSize: 7, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>k={N - 1}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "True phase", value: targetPhase.toFixed(4), color: "var(--text-primary)" },
          { label: "Estimated", value: estimatedPhase.toFixed(4), color: "#AB47BC" },
          { label: "Error", value: Math.abs(targetPhase - estimatedPhase).toExponential(2), color: Math.abs(targetPhase - estimatedPhase) < 0.01 ? "#66BB6A" : "#EF5350" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "var(--bg-card)", borderRadius: 8, padding: "10px 12px",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VQE EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
function VQEExplorer() {
  const [theta, setTheta] = useState(0.0)
  const [history, setHistory] = useState<{ theta: number; energy: number }[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  // H₂ molecule energy as function of parameterized ansatz (simplified model)
  // E(θ) = -1.0 + 0.5*cos(θ) + 0.3*cos(2θ)
  const energy = (t: number) => -1.0 + 0.5 * Math.cos(t) + 0.3 * Math.cos(2 * t)
  const currentE = energy(theta)
  const optTheta = Math.PI  // approximate optimal
  const groundE = energy(optTheta)

  // Simple gradient descent optimizer
  function runOptimizer() {
    if (isRunning) { setIsRunning(false); clearInterval(timerRef.current); return }
    setIsRunning(true)
    let t = theta
    const newHistory: typeof history = [...history]
    let step = 0
    timerRef.current = setInterval(() => {
      const grad = (energy(t + 0.01) - energy(t - 0.01)) / 0.02
      t -= 0.2 * grad
      newHistory.push({ theta: t, energy: energy(t) })
      setTheta(t)
      setHistory([...newHistory])
      step++
      if (step > 30 || Math.abs(grad) < 0.001) {
        setIsRunning(false)
        clearInterval(timerRef.current)
      }
    }, 200)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const W = 520, H = 120
  const PAD = { top: 10, right: 12, bottom: 24, left: 40 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom

  // Energy landscape curve
  const nPts = 100
  const toX = (t: number) => PAD.left + ((t + Math.PI) / (2 * Math.PI)) * iW
  const eMin = -1.8, eMax = -0.2
  const toY = (e: number) => PAD.top + ((eMax - e) / (eMax - eMin)) * iH

  const curvePath = Array.from({ length: nPts }, (_, i) => {
    const t = -Math.PI + (i / (nPts - 1)) * 2 * Math.PI
    return `${i === 0 ? "M" : "L"}${toX(t).toFixed(1)},${toY(energy(t)).toFixed(1)}`
  }).join(" ")

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
        Variational Quantum Eigensolver (VQE)
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        Find the ground state energy of H₂ molecule using a parameterized quantum circuit.
        The <strong style={{ color: "#E91E63" }}>quantum computer</strong> evaluates ⟨ψ(θ)|H|ψ(θ)⟩, while a{' '}
        <strong style={{ color: "var(--text-primary)" }}>classical optimizer</strong> adjusts θ.
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Ansatz parameter θ</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#E91E63", fontWeight: 700 }}>
              {theta.toFixed(3)}
            </span>
          </div>
          <input type="range" min={-Math.PI} max={Math.PI} step={0.01} value={theta}
            onChange={e => { setTheta(Number(e.target.value)); setHistory([]) }}
            style={{ width: "100%", accentColor: "#E91E63" }} />
        </div>
        <button onClick={runOptimizer} style={{
          padding: "6px 18px", fontSize: 12, fontWeight: 700, borderRadius: 6,
          background: isRunning ? "var(--accent-amber)" : "#E91E63",
          color: "#fff", border: "none", cursor: "pointer",
        }}>{isRunning ? "⏸ Stop" : "▶ Optimize"}</button>
      </div>

      {/* Energy landscape */}
      <div style={{
        padding: "10px 14px", background: "var(--bg-panel)", borderRadius: 8,
        border: "1px solid var(--border)", marginBottom: 16,
      }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
          ENERGY LANDSCAPE E(θ) — H₂ MOLECULE
        </div>
        <svg width={W} height={H} style={{ display: "block" }}>
          {[eMin, (eMin + eMax) / 2, eMax].map(e => (
            <g key={e}>
              <line x1={PAD.left} x2={W - PAD.right} y1={toY(e)} y2={toY(e)}
                stroke="var(--border)" strokeWidth={0.5} />
              <text x={PAD.left - 4} y={toY(e) + 3} fontSize={7}
                fill="var(--text-muted)" textAnchor="end" fontFamily="var(--font-mono)">{e.toFixed(1)}</text>
            </g>
          ))}
          <path d={curvePath} fill="none" stroke="#E91E63" strokeWidth={2} />
          {/* Ground state line */}
          <line x1={PAD.left} x2={W - PAD.right} y1={toY(groundE)} y2={toY(groundE)}
            stroke="#66BB6A" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
          {/* History points */}
          {history.map((h, i) => (
            <circle key={i} cx={toX(h.theta)} cy={toY(h.energy)} r={2}
              fill="rgba(233,30,99,0.4)" />
          ))}
          {/* Current position */}
          <circle cx={toX(theta)} cy={toY(currentE)} r={5}
            fill="#E91E63" stroke="#fff" strokeWidth={1.5} />
          <text x={toX(theta)} y={toY(currentE) - 8} textAnchor="middle"
            fontSize={8} fill="#E91E63" fontWeight={700} fontFamily="var(--font-mono)">
            E={currentE.toFixed(3)}
          </text>
        </svg>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Current E", value: currentE.toFixed(4) + " Ha", color: "#E91E63" },
          { label: "Ground state", value: groundE.toFixed(4) + " Ha", color: "#66BB6A" },
          { label: "Error", value: (currentE - groundE).toFixed(4) + " Ha", color: Math.abs(currentE - groundE) < 0.05 ? "#66BB6A" : "var(--accent-amber)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "var(--bg-card)", borderRadius: 8, padding: "10px 12px",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QUANTUM WALK EXPLORER
// ─────────────────────────────────────────────────────────────────────────────
function QuantumWalkExplorer() {
  const [steps, setSteps] = useState(20)
  const [coin, setCoin] = useState<'hadamard' | 'biased'>('hadamard')

  const positions = 2 * steps + 1
  const center = steps

  // Simulate 1D discrete quantum walk
  const { qProbs, cProbs } = useMemo(() => {
    // Quantum walk state: |coin⟩ ⊗ |position⟩
    // coin: 2D (|0⟩, |1⟩), position: (2*steps+1)D
    const n = positions
    // State: [re_0, im_0, re_1, im_1] for each position (coin 0 and coin 1)
    let state = new Float64Array(4 * n)  // [coin0_re, coin0_im, coin1_re, coin1_im] per position
    // Initialize: |0⟩_coin ⊗ |center⟩_position
    state[4 * center] = 1  // coin0_re at center

    // Coin operator (Hadamard or biased)
    const c00 = coin === 'hadamard' ? 1 / Math.sqrt(2) : 0.8
    const c01 = coin === 'hadamard' ? 1 / Math.sqrt(2) : 0.6
    const c10 = coin === 'hadamard' ? 1 / Math.sqrt(2) : 0.6
    const c11 = coin === 'hadamard' ? -1 / Math.sqrt(2) : -0.8

    for (let step = 0; step < steps; step++) {
      // Apply coin
      const after_coin = new Float64Array(4 * n)
      for (let p = 0; p < n; p++) {
        const a0r = state[4 * p], a0i = state[4 * p + 1]
        const a1r = state[4 * p + 2], a1i = state[4 * p + 3]
        after_coin[4 * p] = c00 * a0r + c01 * a1r
        after_coin[4 * p + 1] = c00 * a0i + c01 * a1i
        after_coin[4 * p + 2] = c10 * a0r + c11 * a1r
        after_coin[4 * p + 3] = c10 * a0i + c11 * a1i
      }
      // Apply shift: |0⟩ → move left, |1⟩ → move right
      const next = new Float64Array(4 * n)
      for (let p = 0; p < n; p++) {
        if (p > 0) {
          next[4 * (p - 1)] += after_coin[4 * p]
          next[4 * (p - 1) + 1] += after_coin[4 * p + 1]
        }
        if (p < n - 1) {
          next[4 * (p + 1) + 2] += after_coin[4 * p + 2]
          next[4 * (p + 1) + 3] += after_coin[4 * p + 3]
        }
      }
      state = next
    }

    // Compute quantum probabilities
    const qProbs = Array.from({ length: n }, (_, p) => {
      return state[4 * p] ** 2 + state[4 * p + 1] ** 2 +
             state[4 * p + 2] ** 2 + state[4 * p + 3] ** 2
    })

    // Compute classical random walk for comparison
    const cProbs = new Array(n).fill(0)
    cProbs[center] = 1
    for (let step = 0; step < steps; step++) {
      const next = new Array(n).fill(0)
      for (let p = 0; p < n; p++) {
        if (p > 0) next[p - 1] += cProbs[p] * 0.5
        if (p < n - 1) next[p + 1] += cProbs[p] * 0.5
      }
      for (let p = 0; p < n; p++) cProbs[p] = next[p]
    }

    return { qProbs, cProbs }
  }, [steps, coin, positions, center])

  const maxQ = Math.max(...qProbs, 0.001)
  const maxC = Math.max(...cProbs, 0.001)
  const maxP = Math.max(maxQ, maxC)
  const barH = 100

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Quantum Walk</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.7, marginBottom: 20 }}>
        1D discrete quantum walk: a quantum particle spreads{' '}
        <strong style={{ color: "#00897B" }}>ballistically (∝ t)</strong> compared to classical random walk's{' '}
        <strong style={{ color: "var(--text-muted)" }}>diffusive spread (∝ √t)</strong>.
        Basis for quantum search algorithms on graphs.
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Steps</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#00897B", fontWeight: 700 }}>{steps}</span>
          </div>
          <input type="range" min={1} max={40} value={steps} onChange={e => setSteps(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#00897B" }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>Coin</div>
          <div style={{ display: "flex", gap: 4 }}>
            {(['hadamard', 'biased'] as const).map(c => (
              <button key={c} onClick={() => setCoin(c)} style={{
                padding: "4px 10px", borderRadius: 4, fontSize: 11, textTransform: "capitalize",
                background: coin === c ? "#00897B" : "var(--bg-card)",
                color: coin === c ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${coin === c ? "#00897B" : "var(--border)"}`,
              }}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Probability distribution */}
      <div style={{
        padding: "14px 16px", background: "var(--bg-panel)", borderRadius: 8,
        border: "1px solid var(--border)", marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            POSITION PROBABILITY after {steps} steps
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 3, background: "#00897B", borderRadius: 1, display: "inline-block" }} />
              <span style={{ color: "#00897B" }}>quantum</span>
            </span>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 3, background: "var(--border-bright)", borderRadius: 1, display: "inline-block" }} />
              <span style={{ color: "var(--text-muted)" }}>classical</span>
            </span>
          </div>
        </div>
        <div style={{ position: "relative", height: barH + 4, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "flex-end", height: barH, gap: 0, position: "absolute", bottom: 0, left: 0, right: 0 }}>
            {qProbs.map((p, i) => (
              <div key={`q-${i}`} style={{
                flex: 1, height: Math.max(0.5, (p / maxP) * barH),
                background: "#00897B", opacity: 0.7,
                borderRadius: "1px 1px 0 0",
                transition: "height 0.3s",
              }} />
            ))}
          </div>
          {/* Classical overlay as line */}
          <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: barH + 4 }}
            viewBox={`0 0 ${positions} ${barH}`} preserveAspectRatio="none">
            <polyline
              points={cProbs.map((p, i) => `${i + 0.5},${barH - (p / maxP) * barH}`).join(" ")}
              fill="none" stroke="var(--border-bright)" strokeWidth={1.5}
            />
          </svg>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 4,
          fontSize: 7, fontFamily: "var(--font-mono)", color: "var(--text-muted)",
        }}>
          <span>-{steps}</span>
          <span>0</span>
          <span>+{steps}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Quantum spread", value: `∝ ${steps} (ballistic)`, color: "#00897B" },
          { label: "Classical spread", value: `∝ √${steps} ≈ ${Math.sqrt(steps).toFixed(1)} (diffusive)`, color: "var(--text-muted)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "var(--bg-card)", borderRadius: 8, padding: "10px 12px",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
