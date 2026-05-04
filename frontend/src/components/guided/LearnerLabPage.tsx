import { Editor } from "@monaco-editor/react"
import { UserButton } from "@neondatabase/neon-js/auth/react/ui"
import { ChevronLeft, MoonStar, Play, RotateCcw, StepForward, SunMedium } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom"

import { SignOutButton } from "@/components/auth/SignOutButton"
import { LearningStudioPanel } from "@/components/learning/LearningStudioPanel"
import { useThemeMode } from "@/hooks/useThemeMode"
import { fetchPublicWorkspaceCatalog, simulateWorkspaceProgram } from "@/lib/workspace/api"
import { circuitSnapshotToProgram } from "@/lib/workspace/circuitToProgram"
import { parsePseudoProgram } from "@/lib/workspace/pseudoParser"
import { programToCircuit } from "@/lib/workspace/programToCircuit"
import type { WorkspaceCatalogResponse, WorkspaceSimulationResponse, WorkspaceTemplate } from "@/lib/workspace/types"
import { useCircuitStore } from "@/store/circuitStore"
import { useLearningStore } from "@/store/learningStore"
import { useSimStore } from "@/store/simStore"
import { AlgorithmSettingsPanel, BlochInspector, DocsPanel, StateInspector } from "@/components/workspace/WorkspaceInspectors"
import WorkspaceAnalysisPanel from "@/components/workspace/WorkspaceAnalysisPanel"
import { WorkspaceCircuitBuilder } from "@/components/workspace/WorkspaceCircuitBuilder"
import { PreFlightModal } from "@/components/workspace/PreFlightModal"
import { StepWalkthroughModal } from "@/components/workspace/StepWalkthroughModal"
import { getLearnerExperience, getLearnerLaunchConfig, getLearnerTopicConfig, isLearnerKind, type LearnerInspectorId, type LearnerLabAction } from "@/lib/learning/learnerFlow"

const ACTION_LABELS: Record<LearnerLabAction, string> = {
  inputs: "Try with Inputs",
  circuit: "Load Circuit",
  lab: "Try Lab",
}

function normalizeAction(value: string | null): LearnerLabAction {
  if (value === "inputs" || value === "circuit" || value === "lab") return value
  return "lab"
}

export function LearnerLabPage() {
  const { kind, topic } = useParams()
  const [searchParams] = useSearchParams()
  const { theme, setTheme } = useThemeMode()

  const labAction = normalizeAction(searchParams.get("action"))
  if (!isLearnerKind(kind) || !topic) {
    return <Navigate to="/learn/protocol" replace />
  }

  const topicConfig = getLearnerTopicConfig(topic)
  const launchConfig = getLearnerLaunchConfig(topic, labAction)
  if (!topicConfig || topicConfig.kind !== kind || !launchConfig) {
    return <Navigate to={`/learn/${kind}`} replace />
  }

  const learningExperience = getLearnerExperience(topic)
  const selectLearningExperience = useLearningStore((s) => s.select)
  const loadLearningCircuit = useLearningStore((s) => s.loadIntoCircuit)
  const circuitQubitCount = useCircuitStore((s) => s.nQubits)
  const circuitGates = useCircuitStore((s) => s.gates)
  const circuitInitialStates = useCircuitStore((s) => s.initialStates)

  const preflightOpen = useSimStore((s) => s.preflightOpen)
  const setPreflightOpen = useSimStore((s) => s.setPreflightOpen)
  const walkthroughOpen = useSimStore((s) => s.walkthroughOpen)
  const setWalkthroughOpen = useSimStore((s) => s.setWalkthroughOpen)
  const walkthroughStep = useSimStore((s) => s.walkthroughStep)
  const setWalkthroughStep = useSimStore((s) => s.setWalkthroughStep)
  const openForWalkthrough = useSimStore((s) => s.openForWalkthrough)
  const setOpenForWalkthrough = useSimStore((s) => s.setOpenForWalkthrough)
  const loadTemplate = useSimStore((s) => s.loadTemplate)
  const engine = useSimStore((s) => s.engine)
  const setEngine = useSimStore((s) => s.setEngine)
  const applySimulationResponse = useSimStore((s) => s.applySimulationResponse)
  const activeTemplate = useSimStore((s) => s.activeTemplate)

  const [source, setSource] = useState("")
  const [catalog, setCatalog] = useState<WorkspaceCatalogResponse | null>(null)
  const [simulation, setSimulation] = useState<WorkspaceSimulationResponse | null>(null)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [helperNotice, setHelperNotice] = useState<string | null>(null)
  const [validationFailed, setValidationFailed] = useState(false)
  const [activeInspector, setActiveInspector] = useState<LearnerInspectorId>(launchConfig.enabledInspectors[0] ?? "studio")
  const [activeStep, setActiveStep] = useState(0)
  const [running, setRunning] = useState(false)
  const executionTokenRef = useRef(0)
  const isParserWritingRef = useRef(false)
  const isCircuitWritingRef = useRef(false)

  useEffect(() => {
    selectLearningExperience(learningExperience.id)
  }, [learningExperience.id, selectLearningExperience])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      setHelperNotice(null)
      setRuntimeError(null)
      setSimulation(null)
      setValidationFailed(false)
      await setEngine(launchConfig.engine)

      const learnerCatalog = await fetchPublicWorkspaceCatalog().catch(() => null)
      if (active) setCatalog(learnerCatalog)

      if (launchConfig.templateId && launchConfig.labAction !== "circuit" && learnerCatalog) {
        const template = learnerCatalog.templates.find((item) => item.id === launchConfig.templateId) ?? null
        if (template) {
          const hydrated = await loadTemplate(template)
          if (!active) return
          setSource(hydrated)
          if (launchConfig.labAction === "inputs" && !template.parameters?.length) {
            setHelperNotice("This lesson does not expose dedicated template parameters yet, so the guided input lab starts with default code you can edit.")
          }
          return
        }
      }

      loadLearningCircuit(learningExperience.id)
      const fallbackSource = circuitSnapshotToProgram({
        nQubits: learningExperience.nQubits,
        gates: learningExperience.gates.map((gate, index) => ({ ...gate, id: `learner-${learningExperience.id}-${index}` })),
        initialStates: learningExperience.initialStates ?? Array.from({ length: learningExperience.nQubits }, () => "|0⟩" as const),
      })
      if (active) {
        setSource(fallbackSource)
        if (launchConfig.labAction === "inputs" && !launchConfig.hasGuidedInputs) {
          setHelperNotice("This lesson currently uses default inputs. You can still edit the code or circuit and run the simplified lab.")
        }
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [launchConfig.engine, launchConfig.hasGuidedInputs, launchConfig.labAction, launchConfig.templateId, learningExperience.gates, learningExperience.id, learningExperience.initialStates, learningExperience.nQubits, loadLearningCircuit, loadTemplate, setEngine])

  const parsed = useMemo(() => {
    if (engine === "custom") {
      return parsePseudoProgram(source)
    }
    return { errors: [], warnings: [], instructions: [], qubits: [], actors: [] }
  }, [engine, source])

  const canSyncCircuit = engine === "custom" && parsed.errors.length === 0 && parsed.instructions.length > 0
  const selectedStep = simulation?.steps[Math.min(activeStep, Math.max(simulation.steps.length - 1, 0))] ?? null
  const selectedState = selectedStep?.state ?? null

  useEffect(() => {
    if (isParserWritingRef.current) return
    if (!circuitGates.length && source.trim()) return
    const nextSource = circuitSnapshotToProgram({
      nQubits: circuitQubitCount,
      gates: circuitGates,
      initialStates: circuitInitialStates,
    })
    isCircuitWritingRef.current = true
    setSource((prev) => (nextSource !== prev ? nextSource : prev))
  }, [circuitGates, circuitInitialStates, circuitQubitCount, source])

  useEffect(() => {
    if (isCircuitWritingRef.current) {
      isCircuitWritingRef.current = false
      return
    }
    if (!canSyncCircuit) return
    const snapshot = programToCircuit(parsed.instructions)
    isParserWritingRef.current = true
    useCircuitStore.getState().replaceCircuit(snapshot.gates, snapshot.nQubits, snapshot.initialStates)
    queueMicrotask(() => {
      isParserWritingRef.current = false
    })
  }, [canSyncCircuit, parsed.instructions])

  async function executeProgram(code: string) {
    const executionToken = executionTokenRef.current + 1
    executionTokenRef.current = executionToken
    setRunning(true)

    try {
      const response = await simulateWorkspaceProgram(code, engine, { preferGpu: false })
      if (executionToken !== executionTokenRef.current) return false
      setSimulation(response)
      applySimulationResponse(response, response.engine || engine)
      setRuntimeError(null)
      setActiveStep(Math.max(response.steps.length - 1, 0))

      if (openForWalkthrough) {
        setWalkthroughStep(0)
        setWalkthroughOpen(true)
        setOpenForWalkthrough(false)
      }
    } catch (error) {
      if (executionToken !== executionTokenRef.current) return false
      setSimulation(null)
      setRuntimeError(error instanceof Error ? error.message : "Program execution failed.")
      return false
    } finally {
      if (executionToken === executionTokenRef.current) {
        setRunning(false)
      }
    }

    return true
  }

  async function handleRunWorkspace() {
    setValidationFailed(false)
    setRuntimeError(null)
    setActiveInspector("state")

    if (!source.trim()) {
      setRuntimeError("Code cannot be empty.")
      return false
    }
    if (parsed.errors.length > 0) {
      setRuntimeError("Please fix syntax errors before running.")
      return false
    }

    const templateParams = useSimStore.getState().templateParams
    const hasEmptyParams = Object.values(templateParams).some((value) => value === "" || value === null || value === undefined)
    if (hasEmptyParams || source.includes("{{")) {
      setValidationFailed(true)
      setRuntimeError("Please provide valid values for all guided inputs before running.")
      return false
    }

    return executeProgram(source)
  }

  function handleStepExecution() {
    setValidationFailed(false)
    setRuntimeError(null)

    if (!simulation || simulation.steps.length === 0) {
      setOpenForWalkthrough(true)
      setPreflightOpen(true)
      return
    }
    setWalkthroughStep(0)
    setWalkthroughOpen(true)
  }

  const selectedTemplate = launchConfig.templateId ? catalog?.templates.find((item) => item.id === launchConfig.templateId) ?? null : null

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link to={`/learn/${kind}/${topic}`} style={backButtonStyle}>
            <ChevronLeft size={14} />
            Back to lesson
          </Link>
          <div>
            <div style={eyebrowStyle}>LEARNER LAB</div>
            <div style={{ fontWeight: 700 }}>{topicConfig.title} — {ACTION_LABELS[labAction]}</div>
          </div>
        </div>

        <div style={headerActionsStyle}>
          <button type="button" style={primaryButtonStyle} onClick={() => setPreflightOpen(true)} disabled={running}>
            <Play size={14} />
            {running ? "Running" : "Run"}
          </button>
          <button type="button" style={secondaryButtonStyle} onClick={handleStepExecution} disabled={running}>
            <StepForward size={14} />
            Step
          </button>
          <button type="button" style={secondaryButtonStyle} onClick={() => { setActiveStep(0); setRuntimeError(null) }} disabled={running}>
            <RotateCcw size={14} />
            Reset
          </button>
          <ThemeToggleButton label="Dark" active={theme === "dark"} icon={<MoonStar size={14} />} onClick={() => setTheme("dark")} />
          <ThemeToggleButton label="Light" active={theme === "light"} icon={<SunMedium size={14} />} onClick={() => setTheme("light")} />
          <SignOutButton style={secondaryButtonStyle} />
          <div style={userButtonShellStyle}><UserButton /></div>
        </div>
      </header>

      <main style={contentGridStyle}>
        <section style={mainColumnStyle}>
          <div style={heroPanelStyle}>
            <div style={eyebrowStyle}>{ACTION_LABELS[labAction].toUpperCase()}</div>
            <h1 style={heroTitleStyle}>{topicConfig.title}</h1>
            <p style={heroBodyStyle}>{topicConfig.summary}</p>
            {helperNotice && <div style={infoNoticeStyle}>{helperNotice}</div>}
          </div>

          <AlgorithmSettingsPanel onUpdateSource={setSource} validationFailed={validationFailed} />

          <WorkspaceCircuitBuilder canSync={canSyncCircuit} />

          <div style={editorPanelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={eyebrowStyle}>PROGRAM</div>
                <div style={{ fontWeight: 700 }}>Guided code editor</div>
              </div>
            </div>
            <Editor
              height="260px"
              language={engine === "qunetsim" ? "python" : engine === "openqasm" ? "c" : "plaintext"}
              theme={theme === "dark" ? "vs-dark" : "light"}
              value={source}
              onChange={(value) => setSource(value ?? "")}
              options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "var(--font-mono)", padding: { top: 12 }, scrollBeyondLastLine: false }}
            />
          </div>
        </section>

        <aside style={sideColumnStyle}>
          <div style={panelStyle}>
            <div style={eyebrowStyle}>STUDIO</div>
            <LearningStudioPanel />
          </div>

          <div style={panelStyle}>
            <div style={eyebrowStyle}>INSPECTORS</div>
            <div style={tabRailStyle}>
              {launchConfig.enabledInspectors.map((inspectorId) => (
                <button
                  key={inspectorId}
                  type="button"
                  onClick={() => setActiveInspector(inspectorId)}
                  style={{
                    ...tabButtonStyle,
                    borderColor: activeInspector === inspectorId ? "var(--accent-cyan)" : "var(--border)",
                    color: activeInspector === inspectorId ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  {inspectorId}
                </button>
              ))}
            </div>

            {runtimeError && <div style={dangerNoticeStyle}>{runtimeError}</div>}

            <div style={inspectorBodyStyle}>
              {activeInspector === "state" && (
                <StateInspector
                  state={selectedState}
                  instructions={parsed.instructions}
                  stepLabel={selectedStep?.event ?? "Run the lesson lab to inspect runtime state."}
                />
              )}
              {activeInspector === "bloch" && <BlochInspector state={selectedState} />}
              {activeInspector === "analysis" && launchConfig.apiCapabilities.analysis && (
                <WorkspaceAnalysisPanel presetLabel={topicConfig.title} presetGates={learningExperience.gates} presetQubits={learningExperience.nQubits} />
              )}
              {activeInspector === "docs" && (
                <DocsPanel
                  syntax={catalog?.syntax ?? []}
                  templates={selectedTemplate ? [selectedTemplate] : []}
                  notes={[
                    "Learner lab keeps simulation controls focused on the selected lesson.",
                    launchConfig.apiCapabilities.analysis
                      ? "Analysis is enabled for this lesson."
                      : "Advanced analysis is intentionally hidden for this lesson to reduce noise.",
                  ]}
                  context={{ title: topicConfig.title, description: topicConfig.summary, kind: topicConfig.kind }}
                />
              )}
              {activeInspector === "studio" && (
                <div style={emptyStateStyle}>Use the studio panel above to inspect the staged lesson animation while you edit and run the simplified lab.</div>
              )}
            </div>
          </div>
        </aside>
      </main>

      <PreFlightModal
        open={preflightOpen}
        onOpenChange={(open) => {
          setPreflightOpen(open)
          if (!open) setOpenForWalkthrough(false)
        }}
        onConfirm={handleRunWorkspace}
        loading={running}
      />

      {simulation && (
        <StepWalkthroughModal
          open={walkthroughOpen}
          onOpenChange={setWalkthroughOpen}
          steps={simulation.steps}
          currentStep={walkthroughStep}
          onStepChange={setWalkthroughStep}
          onFinish={() => setWalkthroughOpen(false)}
        />
      )}
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
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} style={{ ...secondaryButtonStyle, borderColor: active ? "var(--accent-cyan)" : "var(--border)", background: active ? "var(--bg-active)" : "var(--bg-card)" }}>
      {icon}
      {label}
    </button>
  )
}

const pageStyle: CSSProperties = { minHeight: "100vh", padding: 20 }
const headerStyle: CSSProperties = { width: "min(1280px, 100%)", margin: "0 auto 18px", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }
const eyebrowStyle: CSSProperties = { fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }
const headerActionsStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }
const backButtonStyle: CSSProperties = { borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", padding: "10px 14px", textDecoration: "none", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }
const primaryButtonStyle: CSSProperties = { borderRadius: "var(--radius-md)", border: "1px solid var(--accent-cyan)", background: "var(--accent-cyan)", color: "var(--button-primary-text)", padding: "10px 14px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }
const secondaryButtonStyle: CSSProperties = { borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", padding: "10px 14px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }
const userButtonShellStyle: CSSProperties = { display: "inline-flex", alignItems: "center" }
const contentGridStyle: CSSProperties = { width: "min(1280px, 100%)", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(340px, 0.7fr)", gap: 18, alignItems: "start" }
const mainColumnStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }
const sideColumnStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }
const heroPanelStyle: CSSProperties = { borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))", padding: 20 }
const heroTitleStyle: CSSProperties = { fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 3rem)", margin: "8px 0 12px" }
const heroBodyStyle: CSSProperties = { color: "var(--text-secondary)", lineHeight: 1.7 }
const infoNoticeStyle: CSSProperties = { marginTop: 14, borderRadius: "var(--radius-md)", border: "1px solid var(--accent-cyan)", background: "rgba(0, 212, 255, 0.08)", color: "var(--text-secondary)", padding: "12px 14px", lineHeight: 1.6 }
const editorPanelStyle: CSSProperties = { borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", overflow: "hidden", background: "var(--bg-panel)" }
const panelHeaderStyle: CSSProperties = { padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }
const panelStyle: CSSProperties = { borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", background: "var(--bg-panel)", padding: 16, minWidth: 0 }
const tabRailStyle: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 12 }
const tabButtonStyle: CSSProperties = { borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-card)", padding: "8px 12px", textTransform: "capitalize" }
const dangerNoticeStyle: CSSProperties = { borderRadius: "var(--radius-md)", border: "1px solid var(--accent-red)", background: "rgba(248, 113, 113, 0.08)", color: "#fca5a5", padding: "10px 12px", marginBottom: 12 }
const inspectorBodyStyle: CSSProperties = { minHeight: 240 }
const emptyStateStyle: CSSProperties = { borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-active)", padding: "16px", color: "var(--text-secondary)", lineHeight: 1.7 }
