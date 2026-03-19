
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
