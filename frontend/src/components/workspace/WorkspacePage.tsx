import { RefreshCw, type LucideIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"

import { LearningStudioPanel } from "@/components/learning/LearningStudioPanel"
import { LEARNING_EXPERIENCES, type LearningExperience } from "@/lib/quantum/learningCatalog"
import { PRESETS, type CircuitPreset } from "@/lib/quantum/presets"
import { fetchWorkspaceCatalog, runWorkspaceBenchmarks, simulateWorkspaceProgram } from "@/lib/workspace/api"
import { circuitSnapshotToProgram } from "@/lib/workspace/circuitToProgram"
import { parsePseudoProgram } from "@/lib/workspace/pseudoParser"
import type {
  WorkspaceBenchmarkProfile,
  WorkspaceBenchmarkResponse,
  WorkspaceCatalogResponse,
  WorkspaceExecutionState,
  WorkspaceInstruction,
  WorkspaceParserIssue,
  WorkspaceSimulationResponse,
  WorkspaceTemplate,
} from "@/lib/workspace/types"
import { useCircuitStore } from "@/store/circuitStore"
import { useLearningStore } from "@/store/learningStore"
import { BenchmarksPanel, BlochInspector, DocsPanel, StateInspector } from "./WorkspaceInspectors"
import { WorkspaceCircuitBuilder } from "./WorkspaceCircuitBuilder"

const DEFAULT_PROGRAM = `LABEL Bell Pair
INIT q0
INIT q1
H q0
CNOT q0 q1
MEASURE q0 BASIS Z
MEASURE q1 BASIS Z`

const QUICK_SYNTAX = ["INIT q0", "H q0", "CNOT q0 q1", "MEASURE q0 BASIS X", "SEND q0 Alice Bob", "INTERCEPT q0 Eve"]
const INSPECTOR_TABS = [
  { id: "studio", label: "Studio 3D" },
  { id: "state", label: "State" },
  { id: "bloch", label: "Bloch" },
  { id: "benchmarks", label: "Benchmarks" },
  { id: "docs", label: "Docs" },
] as const
const WORKSPACE_VIEWS = [
  { id: "circuit", label: "Circuit Editor" },
  { id: "pseudocode", label: "Pseudo Language" },
] as const
const STUDIO_ALIASES: Record<string, string> = {
  bell: "e91",
  bell_pair: "e91",
  ghz: "e91",
  bb84_eavesdrop: "bb84",
  teleportation_simplified: "teleport",
  superdense_simplified: "superdense",
  grover_starter: "grover",
  qft_signal: "qft",
  qaoa_round: "qaoa",
  qft3: "qft",
  superpos: "qwalk",
}

type InspectorTab = (typeof INSPECTOR_TABS)[number]["id"]
type WorkspaceView = (typeof WORKSPACE_VIEWS)[number]["id"]
type ThemeMode = "light" | "dark"

interface WorkspaceModelOption {
  value: string
  source: "template" | "experience" | "preset"
  groupLabel: string
  id: string
  title: string
  description: string
  kindLabel: string
  tags: string[]
  code?: string
  template?: WorkspaceTemplate
  experience?: LearningExperience
  preset?: CircuitPreset
  studioId?: string | null
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function tokensForOption(option: WorkspaceModelOption) {
  return Array.from(
    new Set(
      [option.id, option.title, option.description, option.studioId ?? "", ...option.tags]
        .flatMap((value) => value.split(/\s+/))
        .map(normalizeToken)
        .filter(Boolean),
    ),
  )
}

function resolveStudioId(rawId: string, tags: string[] = []) {
  const normalizedId = normalizeToken(rawId)
  const normalizedTags = tags.map(normalizeToken)
  const direct = LEARNING_EXPERIENCES.find((experience) => {
    const experienceId = normalizeToken(experience.id)
    const experienceLabel = normalizeToken(experience.label)
    return experienceId === normalizedId || experienceLabel === normalizedId || normalizedTags.includes(experienceId)
  })
  if (direct) return direct.id
  return STUDIO_ALIASES[rawId] ?? STUDIO_ALIASES[normalizedId] ?? null
}

function findRelatedTemplate(option: WorkspaceModelOption, templates: WorkspaceTemplate[]) {
  const tokens = tokensForOption(option)
  const matches = templates.filter((template) => {
    const haystack = [template.id, template.title, template.description, ...template.tags].map(normalizeToken).join(" ")
    return tokens.some((token) => haystack.includes(token))
  })
  return matches[0] ?? null
}

function filterRelatedTemplates(option: WorkspaceModelOption | null, templates: WorkspaceTemplate[]) {
  if (!option || templates.length === 0) return templates
  const tokens = tokensForOption(option)
  const matches = templates.filter((template) => {
    const haystack = [template.id, template.title, template.description, ...template.tags].map(normalizeToken).join(" ")
    return tokens.some((token) => haystack.includes(token))
  })
  return matches.length > 0 ? matches : templates
}

function filterRelatedBenchmarks(option: WorkspaceModelOption | null, profiles: WorkspaceBenchmarkProfile[]) {
  if (!option || profiles.length === 0) return profiles
  const tokens = tokensForOption(option)
  const directMatches = profiles.filter((profile) => {
    const haystack = [profile.id, profile.label, profile.family, profile.description].map(normalizeToken).join(" ")
    return tokens.some((token) => haystack.includes(token))
  })
  if (directMatches.length > 0) return directMatches
  if (option.kindLabel.toLowerCase().includes("protocol")) {
    const communication = profiles.filter((profile) => profile.family === "communication")
    return communication.length > 0 ? communication : profiles
  }
  return profiles
}

export function WorkspacePage() {
  const [source, setSource] = useState(DEFAULT_PROGRAM)
  const [catalog, setCatalog] = useState<WorkspaceCatalogResponse | null>(null)
  const [simulation, setSimulation] = useState<WorkspaceSimulationResponse | null>(null)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [benchmarks, setBenchmarks] = useState<WorkspaceBenchmarkResponse | null>(null)
  const [benchmarking, setBenchmarking] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [activeInspector, setActiveInspector] = useState<InspectorTab>("studio")
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<WorkspaceView>("circuit")
  const [selectedModelValue, setSelectedModelValue] = useState("template:bell_pair")
  const [rightPaneWidth, setRightPaneWidth] = useState(430)
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem("workspace-theme") === "dark" ? "dark" : "light"))
  const containerRef = useRef<HTMLDivElement | null>(null)
  const executionTokenRef = useRef(0)
  const skipAutoExecuteRef = useRef(false)

  const selectLearningExperience = useLearningStore((state) => state.select)
  const loadLearningCircuit = useLearningStore((state) => state.loadIntoCircuit)
  const loadPreset = useCircuitStore((state) => state.loadPreset)
  const circuitQubitCount = useCircuitStore((state) => state.nQubits)
  const circuitGates = useCircuitStore((state) => state.gates)
  const circuitInitialStates = useCircuitStore((state) => state.initialStates)

  const selectionOptions = useMemo<WorkspaceModelOption[]>(() => {
    const templateOptions = (catalog?.templates ?? []).map((template) => ({
      value: `template:${template.id}`,
      source: "template" as const,
      groupLabel: "Workspace Programs",
      id: template.id,
      title: template.title,
      description: template.description,
      kindLabel: `${template.kind} template`,
      tags: template.tags,
      code: template.code,
      template,
      studioId: resolveStudioId(template.id, template.tags),
    }))

    const experienceOptions = LEARNING_EXPERIENCES.map((experience) => ({
      value: `experience:${experience.id}`,
      source: "experience" as const,
      groupLabel: "3D Models",
      id: experience.id,
      title: experience.label,
      description: experience.summary,
      kindLabel: `${experience.kind} studio model`,
      tags: [experience.kind, experience.support],
      experience,
      studioId: experience.id,
    }))

    const presetOptions = PRESETS.map((preset) => ({
      value: `preset:${preset.id}`,
      source: "preset" as const,
      groupLabel: "Circuit Presets",
      id: preset.id,
      title: preset.label,
      description: preset.description,
      kindLabel: "circuit preset",
      tags: ["preset"],
      preset,
      studioId: resolveStudioId(preset.id, [preset.label]),
    }))

    return [...templateOptions, ...experienceOptions, ...presetOptions]
  }, [catalog])

  const selectedModel = selectionOptions.find((option) => option.value === selectedModelValue) ?? null
  const filteredTemplates = useMemo(() => filterRelatedTemplates(selectedModel, catalog?.templates ?? []), [catalog?.templates, selectedModel])
  const filteredBenchmarks = useMemo(() => filterRelatedBenchmarks(selectedModel, catalog?.benchmarks ?? []), [catalog?.benchmarks, selectedModel])
  const parsed = useMemo(() => parsePseudoProgram(source), [source])
  const selectedStep = simulation?.steps[Math.min(activeStep, Math.max(simulation.steps.length - 1, 0))] ?? null
  const selectedState = selectedStep?.state ?? simulation?.final_state ?? null
  const latestMeasurement = selectedState?.measurements[selectedState.measurements.length - 1] ?? null
  const latestTransmission = selectedState?.transmissions[selectedState.transmissions.length - 1] ?? null
  const inspectorContext = selectedModel
    ? { title: selectedModel.title, description: selectedModel.description, kind: selectedModel.kindLabel }
    : null

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("workspace-theme", theme)
  }, [theme])

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      try {
        const response = await fetchWorkspaceCatalog()
        if (!active) return
        setCatalog(response)
        setCatalogError(null)
      } catch (error) {
        if (!active) return
        setCatalogError(error instanceof Error ? error.message : "Unable to load workspace catalog.")
      }
    }

    loadCatalog()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (selectionOptions.length > 0 && !selectionOptions.some((option) => option.value === selectedModelValue)) {
      setSelectedModelValue(selectionOptions[0].value)
    }
  }, [selectionOptions, selectedModelValue])

  useEffect(() => {
    if (parsed.errors.length > 0 || parsed.instructions.length === 0) {
      setSimulation(null)
      setRuntimeError(null)
      return
    }
    if (skipAutoExecuteRef.current) {
      skipAutoExecuteRef.current = false
      return
    }

    const timer = window.setTimeout(async () => {
      await executeProgram(parsed.instructions)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [source])

  async function executeProgram(instructions: WorkspaceInstruction[]) {
    const executionToken = executionTokenRef.current + 1
    executionTokenRef.current = executionToken
    setRunning(true)

    try {
      const response = await simulateWorkspaceProgram(instructions)
      if (executionToken !== executionTokenRef.current) return
      setSimulation(response)
      setRuntimeError(null)
      setActiveStep(Math.max(response.steps.length - 1, 0))
    } catch (error) {
      if (executionToken !== executionTokenRef.current) return
      setSimulation(null)
      setRuntimeError(error instanceof Error ? error.message : "Program execution failed.")
    } finally {
      if (executionToken === executionTokenRef.current) {
        setRunning(false)
      }
    }
  }

  function setProgramWithoutAutoRun(nextSource: string) {
    skipAutoExecuteRef.current = true
    setSource(nextSource)
  }

  function syncSourceFromCircuit() {
    const nextSource = circuitSnapshotToProgram({
      nQubits: circuitQubitCount,
      gates: circuitGates,
      initialStates: circuitInitialStates,
    })
    setProgramWithoutAutoRun(nextSource)
    return nextSource
  }

  function handleWorkspaceViewChange(nextView: WorkspaceView) {
    setActiveWorkspaceView(nextView)
  }

  async function handleRunWorkspace() {
    setActiveInspector("state")
    if (activeWorkspaceView === "circuit") {
      const nextSource = syncSourceFromCircuit()
      const nextParsed = parsePseudoProgram(nextSource)
      if (nextParsed.errors.length > 0 || nextParsed.instructions.length === 0) {
        setRuntimeError("Circuit could not be converted into runnable pseudocode.")
        setSimulation(null)
        return
      }
      await executeProgram(nextParsed.instructions)
      return
    }

    if (parsed.errors.length > 0 || parsed.instructions.length === 0) {
      setRuntimeError("Fix the pseudocode errors before running the backend.")
      return
    }

    await executeProgram(parsed.instructions)
  }

  async function handleRunBenchmarks() {
    try {
      setBenchmarking(true)
      const response = await runWorkspaceBenchmarks(filteredBenchmarks.map((item) => item.id))
      setBenchmarks(response)
      setActiveInspector("benchmarks")
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : "Benchmark run failed.")
    } finally {
      setBenchmarking(false)
    }
  }

  function applySelection(option: WorkspaceModelOption) {
    setSelectedModelValue(option.value)
    setActiveInspector("studio")
    setActiveWorkspaceView("circuit")

    if (option.studioId) {
      selectLearningExperience(option.studioId)
    }

    if (option.source === "template" && option.code) {
      setSource(option.code)
      return
    }

    const templateMatch = findRelatedTemplate(option, catalog?.templates ?? [])
    if (templateMatch) {
      setSource(templateMatch.code)
      return
    }

    if (option.experience) {
      loadLearningCircuit(option.experience.id)
      setSource(
        circuitSnapshotToProgram({
          nQubits: option.experience.nQubits,
          gates: option.experience.gates.map((gate, index) => ({ ...gate, id: `experience-${option.experience?.id}-${index}` })),
          initialStates: option.experience.initialStates ?? Array.from({ length: option.experience.nQubits }, () => "|0⟩" as const),
        }),
      )
      return
    }

    if (option.preset) {
      loadPreset(option.preset.gates, option.preset.nQubits)
      setSource(
        circuitSnapshotToProgram({
          nQubits: option.preset.nQubits,
          gates: option.preset.gates.map((gate, index) => ({ ...gate, id: `preset-${option.preset?.id}-${index}` })),
          initialStates: Array.from({ length: option.preset.nQubits }, () => "|0⟩" as const),
        }),
      )
    }
  }

  function handleResizeStart(event: ReactPointerEvent<HTMLDivElement>) {
    const container = containerRef.current
    if (!container) return

    event.preventDefault()
    const bounds = container.getBoundingClientRect()
    const onMove = (moveEvent: PointerEvent) => {
      const nextWidth = bounds.right - moveEvent.clientX
      const maxWidth = Math.min(760, bounds.width - 320)
      const clamped = Math.max(320, Math.min(maxWidth, nextWidth))
      setRightPaneWidth(clamped)
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, WorkspaceModelOption[]>()
    selectionOptions.forEach((option) => {
      const items = groups.get(option.groupLabel) ?? []
      items.push(option)
      groups.set(option.groupLabel, items)
    })
    return Array.from(groups.entries())
  }, [selectionOptions])

  return (
    <div style={pageShellStyle}>
      <header style={workspaceHeaderStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <div style={eyebrowStyle}>QUANTUM WORKSPACE</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={workspaceTitleStyle}>{selectedModel?.title ?? "Integrated circuit workspace"}</h1>
            <StatusBadge label={running ? "backend active" : "backend ready"} tone={running ? "info" : "success"} />
            {selectedModel && <StatusBadge label={selectedModel.kindLabel} tone="neutral" />}
          </div>
          <p style={workspaceCopyStyle}>
            {selectedModel?.description ??
              "Keep the circuit editor visible, switch into pseudocode when you want to write logic, and inspect the backend runtime from the same workspace."}
          </p>
        </div>

        <div style={headerRailStyle}>
          <div style={controlBoxStyle}>
            <div style={controlLabelStyle}>Load algorithm/protocol</div>
            <select
              value={selectedModelValue}
              onChange={(event) => {
                const option = selectionOptions.find((item) => item.value === event.target.value)
                if (option) {
                  applySelection(option)
                }
              }}
              style={selectControlStyle}
            >
              {groupedOptions.map(([groupLabel, options]) => (
                <optgroup key={groupLabel} label={groupLabel}>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={controlBoxStyle}>
            <div style={controlLabelStyle}>Theme</div>
            <div style={themeSegmentStyle}>
              <ThemeToggleButton label="Dark mode" active={theme === "dark"} onClick={() => setTheme("dark")} />
              <ThemeToggleButton label="Light mode" active={theme === "light"} onClick={() => setTheme("light")} />
            </div>
          </div>

          <ToolbarButton
            icon={RefreshCw}
            label={running ? "Running backend" : "Run backend"}
            style={primaryButtonStyle}
            onClick={handleRunWorkspace}
            disabled={activeWorkspaceView === "pseudocode" && (parsed.errors.length > 0 || parsed.instructions.length === 0)}
            spinning={running}
          />
        </div>
      </header>

      <div ref={containerRef} className="workspace-main" style={{ "--workspace-right-width": `${rightPaneWidth}px` } as CSSProperties}>
        <section className="workspace-pane workspace-left-pane">
          <SectionCard
            title="Runtime Rail"
            subtitle="The backend execution trace follows whichever model is currently loaded."
            action={
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <StatusBadge label={`${simulation?.summary.total_steps ?? parsed.instructions.length} steps`} tone="neutral" />
                <StatusBadge label={`${simulation?.summary.measurements ?? 0} measurements`} tone="info" />
              </div>
            }
          >
            <div style={timelineSurfaceStyle}>
              <div style={runtimeSummaryStyle}>
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <div style={eyebrowStyle}>Current Instruction</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {selectedStep?.instruction.raw ?? "Run the backend to inspect the current model."}
                  </div>
                </div>
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <div style={eyebrowStyle}>Backend Event</div>
                  <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>
                    {selectedStep?.event ?? "Waiting for valid code"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <input
                  type="range"
                  min={0}
                  max={Math.max((simulation?.steps.length ?? 1) - 1, 0)}
                  value={Math.min(activeStep, Math.max((simulation?.steps.length ?? 1) - 1, 0))}
                  onChange={(event) => setActiveStep(Number(event.target.value))}
                  style={{ flex: "1 1 320px" }}
                  disabled={!simulation || simulation.steps.length === 0}
                />
                <span style={timelineCounterStyle}>
                  {selectedStep ? `${selectedStep.index + 1}/${simulation?.steps.length ?? 0}` : "idle"}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={activeWorkspaceView === "circuit" ? "Circuit Editor" : "Pseudo Language"}
            subtitle={
              activeWorkspaceView === "circuit"
                ? "Use the grid as the main editor. Running the backend will write the matching pseudo language for this circuit."
                : "Edit the custom pseudo language here, then switch back to the circuit view whenever you want."
            }
            action={
              <div style={tabRailStyle}>
                {WORKSPACE_VIEWS.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => handleWorkspaceViewChange(view.id)}
                    style={{
                      ...tabButtonStyle,
                      borderColor: activeWorkspaceView === view.id ? "var(--accent-cyan)" : "var(--border)",
                      color: activeWorkspaceView === view.id ? "var(--text-primary)" : "var(--text-secondary)",
                      background: activeWorkspaceView === view.id ? "var(--bg-active)" : "transparent",
                    }}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            }
          >
            {activeWorkspaceView === "circuit" ? (
              <WorkspaceCircuitBuilder instructions={parsed.instructions} canSync={parsed.errors.length === 0 && parsed.instructions.length > 0} />
            ) : (
              <div style={pseudocodeShellStyle}>
                <div style={pseudocodeEditorColumnStyle}>
                  <div style={syntaxChipRailStyle}>
                    {QUICK_SYNTAX.map((line) => (
                      <button key={line} type="button" onClick={() => setSource((current) => `${current.trimEnd()}\n${line}`)} style={syntaxChipStyle}>
                        {line}
                      </button>
                    ))}
                  </div>

                  <textarea value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} style={editorStyle} />
                </div>

                <div style={pseudocodeSidebarStyle}>
                  <div style={metricGridStyle}>
                    <MetricTile label="Qubits" value={String(simulation?.summary.qubits.length ?? parsed.qubits.length)} />
                    <MetricTile label="Actors" value={String(simulation?.summary.actors.length ?? parsed.actors.length)} />
                    <MetricTile label="Steps" value={String(simulation?.summary.total_steps ?? parsed.instructions.length)} />
                    <MetricTile label="Measures" value={String(simulation?.summary.measurements ?? 0)} />
                  </div>

                  <ExecutionSnapshot
                    selectedState={selectedState}
                    instruction={selectedStep?.instruction.raw ?? "No backend step selected yet."}
                    event={selectedStep?.event ?? "Waiting for valid code"}
                    latestMeasurement={latestMeasurement ? `${latestMeasurement.qubit} -> ${latestMeasurement.value} (${latestMeasurement.basis})` : "No measurements yet"}
                    latestTransmission={
                      latestTransmission
                        ? `${latestTransmission.qubit} ${latestTransmission.status} ${latestTransmission.intercepted_by ?? latestTransmission.to_actor ?? ""}`.trim()
                        : "No transport events yet"
                    }
                  />

                  {(runtimeError || catalogError || simulation?.warnings.length) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {runtimeError && <RuntimeNotice tone="danger" text={runtimeError} />}
                      {catalogError && <RuntimeNotice tone="danger" text={catalogError} />}
                      {simulation?.warnings.map((warning) => (
                        <RuntimeNotice key={warning} tone="warning" text={warning} />
                      ))}
                    </div>
                  )}

                  <div className="workspace-support-grid">
                    <IssuePanel
                      title="Parser Feedback"
                      emptyLabel="No parser issues. The program is ready for backend execution."
                      errors={parsed.errors}
                      warnings={parsed.warnings}
                    />
                    <JsonPreview instructions={parsed.instructions} />
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </section>

        <div className="workspace-resizer" onPointerDown={handleResizeStart} title="Resize inspector" />

        <aside className="workspace-pane workspace-right-pane" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
          <SectionCard
            title="Inspector"
            subtitle="The current model selection drives the studio, docs, and benchmark context from here."
            style={{ display: "flex", flexDirection: "column" }}
            action={
              <div style={tabRailStyle}>
                {INSPECTOR_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveInspector(tab.id)}
                    style={{
                      ...tabButtonStyle,
                      borderColor: activeInspector === tab.id ? "var(--accent-cyan)" : "var(--border)",
                      color: activeInspector === tab.id ? "var(--text-primary)" : "var(--text-secondary)",
                      background: activeInspector === tab.id ? "var(--bg-active)" : "transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            }
          >
            {activeInspector === "studio" && <LearningStudioPanel />}
            {activeInspector === "state" && <StateInspector state={selectedState} instructions={parsed.instructions} stepLabel={selectedStep?.event ?? "No active step"} />}
            {activeInspector === "bloch" && <BlochInspector state={selectedState} />}
            {activeInspector === "benchmarks" && (
              <BenchmarksPanel benchmarks={benchmarks} benchmarking={benchmarking} onRun={handleRunBenchmarks} profiles={filteredBenchmarks} context={inspectorContext} />
            )}
            {activeInspector === "docs" && <DocsPanel syntax={catalog?.syntax ?? []} templates={filteredTemplates} notes={catalog?.architecture_notes ?? []} context={inspectorContext} />}
          </SectionCard>
        </aside>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
  style,
}: {
  title: string
  subtitle: string
  action?: ReactNode
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <section style={{ ...sectionCardStyle, ...style }}>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={eyebrowStyle}>{title.toUpperCase()}</div>
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>{title}</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function ToolbarButton({
  icon: Icon,
  label,
  style,
  onClick,
  disabled,
  spinning,
}: {
  icon: LucideIcon
  label: string
  style: CSSProperties
  onClick: () => void
  disabled?: boolean
  spinning?: boolean
}) {
  return (
    <button onClick={onClick} style={{ ...style, opacity: disabled ? 0.55 : 1 }} disabled={disabled}>
      <Icon size={14} className={spinning ? "spin" : undefined} />
      {label}
    </button>
  )
}

function ThemeToggleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: "calc(var(--radius-md) - 4px)",
        border: "1px solid transparent",
        background: active ? "var(--bg-active)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricTileStyle}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
    </div>
  )
}

function ExecutionSnapshot({
  selectedState,
  instruction,
  event,
  latestMeasurement,
  latestTransmission,
}: {
  selectedState: WorkspaceExecutionState | null
  instruction: string
  event: string
  latestMeasurement: string
  latestTransmission: string
}) {
  return (
    <div style={snapshotSurfaceStyle}>
      <div style={snapshotHeroStyle}>
        <div>
          <div style={eyebrowStyle}>Current backend event</div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{event}</div>
          <div style={{ marginTop: 6, color: "var(--text-secondary)", lineHeight: 1.6 }}>{instruction}</div>
        </div>
        <StatusBadge label={selectedState ? `${selectedState.qubits.length} live qubits` : "idle"} tone={selectedState ? "info" : "neutral"} />
      </div>

      <div style={snapshotGridStyle}>
        <SnapshotLine label="Measurement" value={latestMeasurement} />
        <SnapshotLine label="Transport" value={latestTransmission} />
        <SnapshotLine
          label="Ownership"
          value={
            selectedState?.actors.length
              ? selectedState.actors.map((actor) => `${actor.name}:${actor.owned_qubits.length}`).join("  |  ")
              : "No actor assignments yet"
          }
        />
      </div>
    </div>
  )
}

function SnapshotLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={snapshotLineStyle}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>{label}</div>
      <div style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>{value}</div>
    </div>
  )
}

function StatusBadge({ label, tone }: { label: string; tone: "neutral" | "success" | "danger" | "warning" | "info" }) {
  const colors: Record<typeof tone, string> = {
    neutral: "var(--text-muted)",
    success: "var(--accent-green)",
    danger: "var(--accent-red)",
    warning: "var(--accent-amber)",
    info: "var(--accent-cyan)",
  }

  return (
    <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${colors[tone]}`, color: colors[tone], background: "var(--bg-active)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
      {label}
    </span>
  )
}

function IssuePanel({
  title,
  emptyLabel,
  errors,
  warnings,
}: {
  title: string
  emptyLabel: string
  errors: WorkspaceParserIssue[]
  warnings: WorkspaceParserIssue[]
}) {
  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div style={supportPanelStyle}>
        <div style={eyebrowStyle}>{title}</div>
        <div style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>{emptyLabel}</div>
      </div>
    )
  }

  return (
    <div style={supportPanelStyle}>
      <div style={eyebrowStyle}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {errors.map((issue) => (
          <IssueRow key={`error-${issue.line}-${issue.message}`} issue={issue} tone="danger" />
        ))}
        {warnings.map((issue) => (
          <IssueRow key={`warn-${issue.line}-${issue.message}`} issue={issue} tone="warning" />
        ))}
      </div>
    </div>
  )
}

function IssueRow({ issue, tone }: { issue: WorkspaceParserIssue; tone: "danger" | "warning" }) {
  return (
    <div style={{ borderRadius: "var(--radius-md)", border: `1px solid ${tone === "danger" ? "var(--accent-red)" : "var(--accent-amber)"}`, background: "var(--bg-active)", padding: "10px 12px" }}>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: tone === "danger" ? "var(--accent-red)" : "var(--accent-amber)", marginBottom: 4 }}>
        line {issue.line}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 6 }}>{issue.message}</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{issue.raw}</div>
    </div>
  )
}

function JsonPreview({ instructions }: { instructions: WorkspaceInstruction[] }) {
  return (
    <div style={supportPanelStyle}>
      <div style={eyebrowStyle}>Structured JSON</div>
      <pre style={jsonStyle}>{JSON.stringify(instructions, null, 2)}</pre>
    </div>
  )
}

function RuntimeNotice({ tone, text }: { tone: "danger" | "warning"; text: string }) {
  const color = tone === "danger" ? "var(--accent-red)" : "var(--accent-amber)"
  return <div style={{ borderRadius: "var(--radius-md)", border: `1px solid ${color}`, padding: "10px 12px", color }}>{text}</div>
}

const pageShellStyle: CSSProperties = {
  height: "100%",
  minHeight: 0,
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  overflow: "auto",
}

const workspaceHeaderStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  padding: "18px 20px",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-card)",
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 18,
  alignItems: "start",
}

const workspaceTitleStyle: CSSProperties = {
  fontSize: "clamp(1.45rem, 2.4vw, 2rem)",
  lineHeight: 1.1,
}

const workspaceCopyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  maxWidth: 780,
  lineHeight: 1.7,
}

const headerRailStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
}

const controlBoxStyle: CSSProperties = {
  minWidth: 240,
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const controlLabelStyle: CSSProperties = {
  fontSize: 10,
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
}

const selectControlStyle: CSSProperties = {
  minWidth: 240,
  background: "var(--bg-panel)",
}

const themeSegmentStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-panel)",
  padding: 4,
}

const sectionCardStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  boxShadow: "var(--shadow-card)",
  padding: "16px",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
}

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "flex-start",
  marginBottom: 14,
  flexWrap: "wrap",
}

const supportPanelStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "14px",
  minHeight: 0,
}

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  color: "var(--button-primary-text)",
  fontWeight: 700,
  height: "fit-content",
}

const timelineSurfaceStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const runtimeSummaryStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
}

const timelineCounterStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--accent-cyan)",
  minWidth: 52,
  textAlign: "right",
}

const tabRailStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
}

const tabButtonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  fontSize: 12,
  fontWeight: 600,
}

const pseudocodeShellStyle: CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "stretch",
}

const pseudocodeEditorColumnStyle: CSSProperties = {
  flex: "1 1 460px",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
}

const pseudocodeSidebarStyle: CSSProperties = {
  flex: "1 1 360px",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const syntaxChipRailStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 12,
}

const syntaxChipStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
  padding: "6px 10px",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
}

const editorStyle: CSSProperties = {
  width: "100%",
  minHeight: 540,
  resize: "vertical",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  lineHeight: 1.7,
  background: "var(--bg-code)",
  borderRadius: "var(--radius-lg)",
  padding: "14px",
}

const metricGridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
}

const metricTileStyle: CSSProperties = {
  flex: "1 1 120px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "12px",
}

const snapshotSurfaceStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const snapshotHeroStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
}

const snapshotGridStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
}

const snapshotLineStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-active)",
  padding: "10px 12px",
}

const jsonStyle: CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  maxHeight: 260,
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
