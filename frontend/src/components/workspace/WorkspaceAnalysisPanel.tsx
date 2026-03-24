import { useState } from 'react'
import axios from 'axios'

interface EntanglementMetrics {
  concurrence: number | null
  negativity: number | null
  purity: number
  is_entangled: boolean | null
  engine: string
}

interface LandscapeData {
  angles_x: number[]
  angles_y: number[]
  energies: number[][]
  circuit_type: string
  plot_base64: string | null
}

interface StimResult {
  circuit_type: string
  qubits: number
  noise_p: number
  shots: number
  outcome_counts: Record<string, number>
  fidelity: number | null
  engine: string
}

interface AnalysisResponse {
  entanglement: EntanglementMetrics | null
  landscape: LandscapeData | null
  stim: StimResult | null
}

export default function WorkspaceAnalysisPanel() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Settings
  const [qubits, setQubits] = useState(2)
  const [runEnt, setRunEnt] = useState(true)
  const [runLandscape, setRunLandscape] = useState(false)
  const [runStim, setRunStim] = useState(false)
  const [stimNoise, setStimNoise] = useState(0.01)
  const [landscapeType, setLandscapeType] = useState('vqe')

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post<AnalysisResponse>('/api/workspace/analyze', {
        qubits,
        run_entanglement: runEnt,
        run_landscape: runLandscape,
        run_stim: runStim,
        stim_noise: stimNoise,
        landscape_circuit: landscapeType,
      })
      setResult(res.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="analysis-panel" style={{ padding: '1rem' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary, #e2e8f0)' }}>
        🔬 Quantum Analysis
      </h3>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
          Qubits:
          <select
            value={qubits}
            onChange={e => setQubits(Number(e.target.value))}
            style={{ background: 'var(--bg-tertiary, #1e293b)', color: 'inherit', border: '1px solid var(--border, #334155)', borderRadius: '4px', padding: '2px 6px' }}
          >
            {[2, 3, 4, 6, 8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
          <input type="checkbox" checked={runEnt} onChange={e => setRunEnt(e.target.checked)} />
          Entanglement
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
          <input type="checkbox" checked={runLandscape} onChange={e => setRunLandscape(e.target.checked)} />
          Landscape
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
          <input type="checkbox" checked={runStim} onChange={e => setRunStim(e.target.checked)} />
          Stim (QEC)
        </label>
      </div>

      {/* Stim noise control */}
      {runStim && (
        <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
          Noise rate: <input
            type="range" min={0} max={0.2} step={0.005}
            value={stimNoise}
            onChange={e => setStimNoise(Number(e.target.value))}
            style={{ width: '120px', verticalAlign: 'middle' }}
          /> {(stimNoise * 100).toFixed(1)}%
        </div>
      )}

      {/* Landscape type */}
      {runLandscape && (
        <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
          Circuit:
          <select value={landscapeType} onChange={e => setLandscapeType(e.target.value)}
            style={{ marginLeft: '0.5rem', background: 'var(--bg-tertiary, #1e293b)', color: 'inherit', border: '1px solid var(--border, #334155)', borderRadius: '4px', padding: '2px 6px' }}
          >
            <option value="vqe">VQE</option>
            <option value="qaoa">QAOA</option>
          </select>
        </div>
      )}

      <button
        onClick={runAnalysis}
        disabled={loading}
        style={{
          background: loading ? '#475569' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '0.5rem 1.25rem',
          cursor: loading ? 'wait' : 'pointer',
          fontSize: '0.85rem',
          fontWeight: 500,
          marginBottom: '1rem',
        }}
      >
        {loading ? '⏳ Running…' : '▶ Run Analysis'}
      </button>

      {error && <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>⚠ {error}</div>}

      {/* Results */}
      {result?.entanglement && (
        <div style={{ background: 'var(--bg-tertiary, #1e293b)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-primary, #e2e8f0)' }}>
            🔗 Entanglement Metrics
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
            <span>Purity:</span>
            <span style={{ color: result.entanglement.purity > 0.99 ? '#4ade80' : result.entanglement.purity > 0.5 ? '#fbbf24' : '#f87171' }}>
              {result.entanglement.purity.toFixed(4)}
            </span>
            {result.entanglement.concurrence !== null && (
              <>
                <span>Concurrence:</span>
                <span>{result.entanglement.concurrence.toFixed(4)}</span>
              </>
            )}
            {result.entanglement.negativity !== null && (
              <>
                <span>Negativity:</span>
                <span>{result.entanglement.negativity.toFixed(4)}</span>
              </>
            )}
            {result.entanglement.is_entangled !== null && (
              <>
                <span>Entangled:</span>
                <span>{result.entanglement.is_entangled ? '✅ Yes' : '❌ No'}</span>
              </>
            )}
            <span>Engine:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{result.entanglement.engine}</span>
          </div>
        </div>
      )}

      {result?.landscape && (
        <div style={{ background: 'var(--bg-tertiary, #1e293b)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-primary, #e2e8f0)' }}>
            📐 Variational Landscape ({result.landscape.circuit_type.toUpperCase()})
          </h4>
          {result.landscape.plot_base64 ? (
            <img
              src={`data:image/png;base64,${result.landscape.plot_base64}`}
              alt="Energy landscape"
              style={{ width: '100%', maxWidth: '400px', borderRadius: '4px' }}
            />
          ) : (
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Grid: {result.landscape.angles_x.length} × {result.landscape.angles_y.length} points.
              Install matplotlib for plot rendering.
            </p>
          )}
        </div>
      )}

      {result?.stim && (
        <div style={{ background: 'var(--bg-tertiary, #1e293b)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-primary, #e2e8f0)' }}>
            🛡 Stim QEC ({result.stim.circuit_type.toUpperCase()}, {result.stim.qubits}q)
          </h4>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>
            <p style={{ margin: '0 0 0.3rem' }}>Noise: {(result.stim.noise_p * 100).toFixed(1)}% | Shots: {result.stim.shots}</p>
            {result.stim.fidelity !== null && (
              <p style={{ margin: '0 0 0.3rem' }}>
                Fidelity: <span style={{ color: result.stim.fidelity > 0.95 ? '#4ade80' : result.stim.fidelity > 0.8 ? '#fbbf24' : '#f87171', fontWeight: 600 }}>
                  {(result.stim.fidelity * 100).toFixed(1)}%
                </span>
              </p>
            )}
            <div style={{ marginTop: '0.5rem' }}>
              <strong style={{ fontSize: '0.75rem' }}>Top outcomes:</strong>
              <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {Object.entries(result.stim.outcome_counts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([key, count]) => (
                    <div key={key}>|{key}⟩ → {count} ({(count / result.stim!.shots * 100).toFixed(1)}%)</div>
                  ))}
              </div>
            </div>
            <p style={{ margin: '0.3rem 0 0', fontFamily: 'monospace', fontSize: '0.7rem' }}>Engine: {result.stim.engine}</p>
          </div>
        </div>
      )}
    </div>
  )
}
