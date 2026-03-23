import { Cpu, RefreshCw } from "lucide-react"
import type { CSSProperties } from "react"

import type {
  WorkspaceBenchmarkResponse,
  WorkspaceExecutionState,
  WorkspaceInstruction,
  WorkspaceSyntaxItem,
  WorkspaceTemplate,
} from "@/lib/workspace/types"
import { WorkspaceBlochPanel } from "./WorkspaceBlochPanel"

export interface WorkspaceInspectorContext {
  title: string
  description: string
  kind: string
}

export function StateInspector({
  state,
  instructions,
  stepLabel,
}: {
  state: WorkspaceExecutionState | null
  instructions: WorkspaceInstruction[]
  stepLabel: string
}) {
  if (!state) {
    return <div style={emptyBoxStyle}>Run a valid program to inspect the backend runtime state.</div>
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={supportPanelStyle}>
        <div style={eyebrowStyle}>Current Event</div>
        <div style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>{stepLabel}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {state.qubits.map((qubit) => (
          <div key={qubit.id} style={supportPanelStyle}>
            <div style={eyebrowStyle}>{qubit.id}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{qubit.state_label}</div>
            <div style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 13 }}>
              <div>initialized: {String(qubit.initialized)}</div>
              <div>superposition: {String(qubit.superposition)}</div>
              <div>owner: {qubit.owner ?? "none"}</div>
              <div>location: {qubit.location ?? "none"}</div>
              <div>entangled: {qubit.entangled_with.length ? qubit.entangled_with.join(", ") : "no"}</div>
              <div>intercepted by: {qubit.intercepted_by ?? "no"}</div>
              <div>last op: {qubit.last_operation ?? "n/a"}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="workspace-support-grid">
        <div style={supportPanelStyle}>
          <div style={eyebrowStyle}>Measurements</div>
          {state.measurements.length === 0 ? (
            <div style={{ color: "var(--text-secondary)" }}>No measurement results yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {state.measurements.map((measurement) => (
                <div key={`${measurement.step}-${measurement.qubit}`} style={miniRowStyle}>
                  <div>{measurement.qubit}</div>
                  <div>{measurement.basis}</div>
                  <div>{measurement.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={supportPanelStyle}>
          <div style={eyebrowStyle}>Transport Log</div>
          {state.transmissions.length === 0 ? (
            <div style={{ color: "var(--text-secondary)" }}>No send or intercept events yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {state.transmissions.map((transmission) => (
                <div key={`${transmission.step}-${transmission.qubit}-${transmission.status}`} style={miniRowStyle}>
                  <div>{transmission.qubit}</div>
                  <div>{transmission.status}</div>
                  <div>{transmission.intercepted_by ?? transmission.to_actor ?? "n/a"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={supportPanelStyle}>
        <div style={eyebrowStyle}>Instruction Objects</div>
        <pre style={jsonStyle}>{JSON.stringify(instructions, null, 2)}</pre>
      </div>
    </div>
  )
}

export function BlochInspector({ state }: { state: WorkspaceExecutionState | null }) {
  return <WorkspaceBlochPanel blochVectors={state?.bloch_vectors ?? []} />
}

export function BenchmarksPanel({
  benchmarks,
  benchmarking,
  onRun,
  profiles,
  context,
}: {
  benchmarks: WorkspaceBenchmarkResponse | null
  benchmarking: boolean
  onRun: () => Promise<void>
  profiles: { id: string; label: string; description: string; qubits: number; family: string }[]
  context?: WorkspaceInspectorContext | null
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {context && (
        <div style={supportPanelStyle}>
          <div style={eyebrowStyle}>Selected Model</div>
          <strong>{context.title}</strong>
          <div style={{ color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>{context.description}</div>
        </div>
      )}

      <div style={supportPanelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={eyebrowStyle}>Real-Time Benchmarks</div>
            <div style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Run backend benchmark families inspired by MQT Bench to see how the local machine handles simulation workloads.
            </div>
          </div>
          <button onClick={onRun} style={primaryButtonStyle} disabled={benchmarking}>
            {benchmarking ? <RefreshCw size={14} className="spin" /> : <Cpu size={14} />}
            {benchmarking ? "Running..." : "Run benchmarks"}
          </button>
        </div>
      </div>

      <div style={supportPanelStyle}>
        <div style={eyebrowStyle}>Profiles</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          {profiles.map((profile) => (
            <div key={profile.id} style={miniCardStyle}>
              <strong>{profile.label}</strong>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 6 }}>{profile.description}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 8 }}>
                {profile.family} / {profile.qubits}q
              </div>
            </div>
          ))}
        </div>
      </div>

      {benchmarks && (
        <>
          <div className="workspace-support-grid">
            <div style={supportPanelStyle}>
              <div style={eyebrowStyle}>CPU</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{benchmarks.capabilities.cpu}</div>
              <div style={{ color: "var(--text-secondary)" }}>{benchmarks.capabilities.cpu_cores} cores detected</div>
            </div>
            <div style={supportPanelStyle}>
              <div style={eyebrowStyle}>GPU</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                {benchmarks.capabilities.gpu_available ? benchmarks.capabilities.gpu_name ?? "Available" : "Not detected"}
              </div>
              <div style={{ color: "var(--text-secondary)" }}>
                {benchmarks.capabilities.gpu_available ? benchmarks.capabilities.gpu_memory ?? "GPU detected" : "Backend fell back to CPU execution."}
              </div>
            </div>
          </div>

          <div style={supportPanelStyle}>
            <div style={eyebrowStyle}>Results</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {benchmarks.results.map((result) => (
                <div key={result.id} style={miniRowStyle}>
                  <div style={{ minWidth: 90 }}>
                    <strong>{result.label}</strong>
                    <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{result.family}</div>
                  </div>
                  <div>{result.qubits}q</div>
                  <div>{result.depth} depth</div>
                  <div>{result.gate_count} gates</div>
                  <div style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>{result.duration_ms.toFixed(3)} ms</div>
                  <div>{result.engine_used}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, color: "var(--text-secondary)" }}>{benchmarks.reference_note}</div>
          </div>
        </>
      )}
    </div>
  )
}

export function DocsPanel({
  syntax,
  templates,
  notes,
  context,
}: {
  syntax: WorkspaceSyntaxItem[]
  templates: WorkspaceTemplate[]
  notes: string[]
  context?: WorkspaceInspectorContext | null
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {context && (
        <div style={supportPanelStyle}>
          <div style={eyebrowStyle}>Current Workspace Model</div>
          <strong>{context.title}</strong>
          <div style={{ color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>{context.description}</div>
          <div style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 12, fontFamily: "var(--font-mono)" }}>{context.kind}</div>
        </div>
      )}

      <div style={supportPanelStyle}>
        <div style={eyebrowStyle}>Architecture</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notes.map((note) => (
            <div key={note} style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {note}
            </div>
          ))}
        </div>
      </div>

      <div style={supportPanelStyle}>
        <div style={eyebrowStyle}>Syntax Reference</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {syntax.map((item) => (
            <div key={item.syntax} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
              <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", marginBottom: 4 }}>{item.syntax}</div>
              <div style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.description}</div>
              {item.example && <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>Example: {item.example}</div>}
              {item.expands_to && (
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  Expands to: {item.expands_to.join("  •  ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={supportPanelStyle}>
        <div style={eyebrowStyle}>Integrated Templates</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {templates.map((template) => (
            <div key={template.id} style={miniCardStyle}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>{template.kind}</div>
              <strong>{template.title}</strong>
              <div style={{ color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6, fontSize: 13 }}>{template.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const supportPanelStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  padding: "14px",
  minHeight: 0,
}

const miniCardStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-active)",
  padding: "12px",
}

const miniRowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  padding: "10px 12px",
  background: "var(--bg-active)",
}

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  color: "var(--button-primary-text)",
  fontWeight: 700,
}

const emptyBoxStyle: CSSProperties = {
  minHeight: 220,
  display: "grid",
  placeItems: "center",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
}

const jsonStyle: CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  maxHeight: 280,
  overflow: "auto",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-secondary)",
  lineHeight: 1.55,
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  marginBottom: 8,
}
