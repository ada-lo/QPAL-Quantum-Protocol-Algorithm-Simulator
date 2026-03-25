import * as Accordion from "@radix-ui/react-accordion"
import * as Dialog from "@radix-ui/react-dialog"
import * as Tooltip from "@radix-ui/react-tooltip"
import { BookOpenText, ChevronDown, CircleHelp, Cpu, Menu, Play, RefreshCw, RotateCcw, StepForward } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { LearningStudioPanel } from "@/components/learning/LearningStudioPanel"
import { LEARNING_EXPERIENCES, type LearningExperience } from "@/lib/quantum/learningCatalog"
import { PRESETS, type CircuitPreset } from "@/lib/quantum/presets"
import { fetchWorkspaceCatalog, runWorkspaceBenchmarks, simulateWorkspaceProgram } from "@/lib/workspace/api"
import { circuitSnapshotToProgram } from "@/lib/workspace/circuitToProgram"
import { parsePseudoProgram } from "@/lib/workspace/pseudoParser"
import { programToCircuit } from "@/lib/workspace/programToCircuit"
import type {
  WorkspaceBenchmarkProfile,
  WorkspaceBenchmarkResponse,
  WorkspaceCatalogResponse,
  WorkspaceInstruction,
  WorkspaceParserIssue,
  WorkspaceSimulationResponse,
  WorkspaceTemplate,
} from "@/lib/workspace/types"
import type { CircuitGate } from "@/store/circuitStore"
import { useCircuitStore } from "@/store/circuitStore"
import { useLearningStore } from "@/store/learningStore"
import { BlochInspector, DocsPanel, StateInspector } from "./WorkspaceInspectors"
import WorkspaceAnalysisPanel from "./WorkspaceAnalysisPanel"
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
  { id: "analysis", label: "Analysis" },
  { id: "docs", label: "Docs" },
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

const DRAWER_TEMPLATE_GROUPS = [
  {
    id: "foundational",
    label: "FOUNDATIONAL ALGORITHMS",
    items: [
      { id: "deutsch", label: "Deutsch Algorithm" },
      { id: "deutsch_jozsa", label: "Deutsch-Jozsa Algorithm" },
      { id: "bernstein_vazirani", label: "Bernstein-Vazirani Algorithm" },
      { id: "simon", label: "Simon's Algorithm" },
    ],
  },
  {
    id: "communication_security",
    label: "COMMUNICATION & SECURITY",
    items: [
      { id: "bell_pair", label: "Bell Pair Starter" },
      { id: "bb84_eavesdrop", label: "BB84 With Eve" },
      { id: "teleportation_simplified", label: "Teleportation Walkthrough" },
      { id: "superdense_simplified", label: "Superdense Coding" },
      { id: "n_qubit_teleportation", label: "N-Qubit Teleportation" },
      { id: "veto_algorithm", label: "Veto Algorithm" },
      { id: "qpc_socialist_millionaire", label: "QPC (Socialist Millionaire)" },
    ],
  },
  {
    id: "search_math",
    label: "SEARCH & MATH",
    items: [
      { id: "grover_search", label: "Grover's Search" },
      { id: "qft_3qubit", label: "Quantum Fourier Transform" },
      { id: "qpe_simple", label: "Quantum Phase Estimation" },
      { id: "shor_factorization", label: "Shor's Algorithm – Factorization" },
      { id: "hhl_algorithm", label: "HHL Algorithm" },
    ],
  },
  {
    id: "qml",
    label: "QUANTUM MACHINE LEARNING",
    items: [
      { id: "qsvm", label: "QSVM Algorithm" },
      { id: "qkmean", label: "QKmean Algorithm" },
      { id: "qknn", label: "QKNN Algorithm" },
      { id: "qhc", label: "QHC Algorithm" },
      { id: "qpca", label: "QPCA Algorithm" },
      { id: "qperceptron", label: "QPerceptron Algorithm" },
      { id: "qnn", label: "QNN Algorithm" },
      { id: "qaoa_maxcut", label: "QAOA MaxCut" },
    ],
  },
  {
    id: "chemistry_simulation",
    label: "CHEMISTRY & SIMULATION",
    items: [
      { id: "vqe_h2", label: "VQE Ansatz (H₂ molecule)" },
      { id: "quantum_walk_1d", label: "Quantum Walk (1D)" },
    ],
  },
  {
    id: "error_correction",
    label: "ERROR CORRECTION (QEC)",
    items: [
      { id: "qec_3qubit_repetition", label: "QEC: Three-Qubit Repetition Code" },
      { id: "qec_shor_9qubit", label: "QEC: Shor's Nine-Qubit Code" },
    ],
  },
] as const

type InspectorTab = (typeof INSPECTOR_TABS)[number]["id"]
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

function gateSignature(gate: Omit<CircuitGate, "id">) {
  return [
    gate.gateId,
    gate.qubit,
    gate.step,
    gate.targetQubit ?? "",
    gate.controlQubit ?? "",
    gate.angle ?? "",
  ].join(":")
}

function circuitSignature(input: { nQubits: number; gates: Omit<CircuitGate, "id">[]; initialStates: readonly string[] }) {
  const gateParts = input.gates.map(gateSignature).sort().join("|")
  return `${input.nQubits}::${input.initialStates.join(",")}::${gateParts}`
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false)
  const [selectedModelValue, setSelectedModelValue] = useState("template:bell_pair")
  const [rightPaneWidth, setRightPaneWidth] = useState(430)
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem("workspace-theme") === "dark" ? "dark" : "light"))
  const containerRef = useRef<HTMLDivElement | null>(null)
  const executionTokenRef = useRef(0)
  // Sync guard: set to true while the parser is writing to the circuit store
  // so the Visual→Text effect ignores that echo update.
  const isParserWritingRef = useRef(false)

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
  const templateById = useMemo(() => {
    const entries = (catalog?.templates ?? []).map((template) => [template.id, template] as const)
    return new Map(entries)
  }, [catalog?.templates])
  const parsed = useMemo(() => parsePseudoProgram(source), [source])
  const selectedStep = simulation?.steps[Math.min(activeStep, Math.max(simulation.steps.length - 1, 0))] ?? null
  const selectedState = selectedStep?.state ?? simulation?.final_state ?? null
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

    const timer = window.setTimeout(async () => {
      await executeProgram(parsed.instructions)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [source])

  // Text → Visual: parse instructions and push to circuit store.
  // Sets isParserWritingRef so the reverse effect doesn't echo back.
  useEffect(() => {
    if (parsed.instructions.length === 0) return
    const snapshot = programToCircuit(parsed.instructions)
    const nextSignature = circuitSignature({
      nQubits: snapshot.nQubits,
      gates: snapshot.gates,
      initialStates: snapshot.initialStates,
    })
    const currentSignature = circuitSignature({
      nQubits: circuitQubitCount,
      gates: circuitGates.map((gate) => ({
        gateId: gate.gateId,
        qubit: gate.qubit,
        step: gate.step,
        targetQubit: gate.targetQubit,
        controlQubit: gate.controlQubit,
        angle: gate.angle,
      })),
      initialStates: circuitInitialStates,
    })
    if (nextSignature === currentSignature) return
    isParserWritingRef.current = true
    useCircuitStore.getState().replaceCircuit(snapshot.gates, snapshot.nQubits, snapshot.initialStates)
    queueMicrotask(() => {
      isParserWritingRef.current = false
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.instructions])

  // Visual → Text: when the user edits the circuit grid, regenerate pseudocode.
  // Bails immediately if the parser was the one that just wrote the circuit.
  useEffect(() => {
    if (isParserWritingRef.current) return
    const nextSource = circuitSnapshotToProgram({
      nQubits: circuitQubitCount,
      gates: circuitGates,
      initialStates: circuitInitialStates,
    })
    setSource((prev) => (nextSource !== prev ? nextSource : prev))
  }, [circuitQubitCount, circuitGates, circuitInitialStates])

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

  async function handleRunWorkspace() {
    setActiveInspector("state")
    if (parsed.errors.length > 0 || parsed.instructions.length === 0) {
      setRuntimeError("Fix the pseudocode errors before running the backend.")
      return
    }

    await executeProgram(parsed.instructions)
  }

  async function handleRunBenchmarks() {
    try {
      setBenchmarking(true)
      const benchmarkIds =
        filteredBenchmarks.length > 0 ? filteredBenchmarks.map((item) => item.id) : (catalog?.benchmarks ?? []).map((item) => item.id)
      const response = await runWorkspaceBenchmarks(benchmarkIds)
      setBenchmarks(response)
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : "Benchmark run failed.")
    } finally {
      setBenchmarking(false)
    }
  }

  function applySelection(option: WorkspaceModelOption) {
    setSelectedModelValue(option.value)
    setActiveInspector("studio")

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

  function applyTemplateById(templateId: string) {
    const option = selectionOptions.find((item) => item.value === `template:${templateId}`)
    if (option) {
      applySelection(option)
      setDrawerOpen(false)
    }
  }

  function handleStepExecution() {
    if (!simulation || simulation.steps.length === 0) {
      void handleRunWorkspace()
      return
    }
    setActiveInspector("state")
    setActiveStep((current) => Math.min(current + 1, simulation.steps.length - 1))
  }

  function handleResetExecution() {
    setActiveStep(0)
    setRuntimeError(null)
  }

  return (
    <div style={pageShellStyle}>
      {/* ── Fixed top navbar & drawer — all inside one Dialog.Root ── */}
      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <nav style={topNavStyle}>
          <Dialog.Trigger asChild>
            <button type="button" style={navHamburgerStyle} aria-label="Open navigation menu">
              <Menu size={18} />
            </button>
          </Dialog.Trigger>
          <div style={navWorkspaceLabelStyle}>QPAL WORKSPACE</div>
          <div style={navCenterStyle}>
            <Tooltip.Provider delayDuration={140}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button type="button" style={navTitleButtonStyle}>
                    <span>{selectedModel?.title ?? "Quantum Experimentation Workspace"}</span>
                    <CircleHelp size={14} style={{ opacity: 0.7 }} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom" align="center" sideOffset={8} style={titleTooltipStyle}>
                    {selectedModel?.description ??
                      "Define quantum algorithms and protocols in pseudocode, simulate execution, and inspect runtime state."}
                    <Tooltip.Arrow style={{ fill: "#171d2c" }} />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
          <div style={navControlsStyle}>
            <button
              type="button"
              style={{ ...headerExecButtonStyle, borderColor: "var(--accent-green)", color: "var(--accent-green)" }}
              onClick={() => void handleRunWorkspace()}
              disabled={parsed.errors.length > 0 || parsed.instructions.length === 0 || running}
            >
              <Play size={14} />
              {running ? "Running" : "Run All"}
            </button>
            <button type="button" style={headerExecButtonStyle} onClick={handleStepExecution} disabled={running}>
              <StepForward size={14} />
              Step
            </button>
            <button type="button" style={headerExecButtonStyle} onClick={handleResetExecution} disabled={running}>
              <RotateCcw size={14} />
              Reset
            </button>
            <ThemeToggleButton label="Dark" active={theme === "dark"} onClick={() => setTheme("dark")} />
            <ThemeToggleButton label="Light" active={theme === "light"} onClick={() => setTheme("light")} />
          </div>
        </nav>

        {/* Drawer portal renders to document.body, connected via Dialog.Root context */}
        <Dialog.Portal>
          <Dialog.Overlay style={drawerOverlayStyle} />
          <Dialog.Content style={drawerContentStyle}>
            <div style={drawerHeaderStyle}>
              <div>
                <div style={eyebrowStyle}>QPAL NAVIGATION</div>
                <Dialog.Title style={{ fontSize: 20, marginBottom: 4 }}>Workspace Menu</Dialog.Title>
                <Dialog.Description style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Browse algorithm and protocol templates, open docs, or run benchmarks.
                </Dialog.Description>
              </div>
            </div>

            <Accordion.Root
              type="multiple"
              defaultValue={[DRAWER_TEMPLATE_GROUPS[0].id, DRAWER_TEMPLATE_GROUPS[1].id]}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              {DRAWER_TEMPLATE_GROUPS.map((group) => (
                <Accordion.Item key={group.id} value={group.id} style={drawerSectionStyle}>
                  <Accordion.Header>
                    <Accordion.Trigger style={drawerAccordionTriggerStyle}>
                      {group.label}
                      <ChevronDown size={14} />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content style={drawerAccordionContentStyle}>
                    {group.items.map((item) => {
                      const template = templateById.get(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="drawer-template-item"
                          style={drawerTemplateButtonStyle}
                          onClick={() => applyTemplateById(item.id)}
                          disabled={!template}
                          title={template ? template.description : "Template unavailable"}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link to="/docs" style={drawerActionLinkStyle} onClick={() => setDrawerOpen(false)}>
                <BookOpenText size={14} />
                Open docs page
              </Link>
              <button
                type="button"
                style={drawerActionButtonStyle}
                onClick={() => {
                  setDrawerOpen(false)
                  setBenchmarkModalOpen(true)
                }}
              >
                <Cpu size={14} />
                Benchmarks
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={benchmarkModalOpen} onOpenChange={setBenchmarkModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={modalOverlayStyle} />
          <Dialog.Content style={benchmarkModalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div style={eyebrowStyle}>BENCHMARKS</div>
                <Dialog.Title style={{ fontSize: 20, marginBottom: 4 }}>System Benchmarks</Dialog.Title>
                <Dialog.Description style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Run backend benchmark families and inspect hardware + timing results.
                </Dialog.Description>
              </div>
              <button type="button" onClick={() => void handleRunBenchmarks()} style={primaryButtonStyle} disabled={benchmarking}>
                {benchmarking ? <RefreshCw size={14} className="spin" /> : <Cpu size={14} />}
                {benchmarking ? "Running..." : "Run Benchmarks"}
              </button>
            </div>

            <div style={benchmarkStatsGridStyle}>
              <div style={supportPanelStyle}>
                <div style={eyebrowStyle}>CPU</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{benchmarks?.capabilities.cpu ?? "Not scanned yet"}</div>
                <div style={{ color: "var(--text-secondary)", marginTop: 6 }}>
                  {benchmarks ? `${benchmarks.capabilities.cpu_cores} cores` : "Run benchmarks to detect hardware"}
                </div>
              </div>
              <div style={supportPanelStyle}>
                <div style={eyebrowStyle}>GPU</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {benchmarks?.capabilities.gpu_available ? benchmarks.capabilities.gpu_name ?? "Detected" : "Not detected"}
                </div>
                <div style={{ color: "var(--text-secondary)", marginTop: 6 }}>{benchmarks?.capabilities.gpu_memory ?? "CPU fallback if unavailable"}</div>
              </div>
            </div>

            <div style={supportPanelStyle}>
              <div style={eyebrowStyle}>Benchmark Table</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(benchmarks?.results ?? []).map((result) => (
                  <div key={result.id} style={benchmarkRowStyle}>
                    <div style={{ width: 120 }}>
                      <strong>{result.label}</strong>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{result.family}</div>
                    </div>
                    <div style={{ width: 50 }}>{result.qubits}q</div>
                    <div style={{ width: 90 }}>{result.depth} depth</div>
                    <div style={{ width: 100, fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>{result.duration_ms.toFixed(3)} ms</div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={benchmarkBarTrackStyle}>
                        <div style={{ ...benchmarkBarFillStyle, width: `${Math.min(100, result.duration_ms * 8)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {!benchmarks?.results.length && <div style={{ color: "var(--text-secondary)" }}>No benchmark results yet.</div>}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div ref={containerRef} className="workspace-main" style={{ "--workspace-right-width": `${rightPaneWidth}px` } as CSSProperties}>
        <section className="workspace-pane workspace-left-pane">

          <div style={splitWorkspaceHostStyle}>
            <div style={stackedWorkspaceShellStyle}>
              <div style={stackedTopPaneStyle}>
                <WorkspaceCircuitBuilder canSync={parsed.instructions.length > 0} />
              </div>
              <div style={terminalPaneStyle}>
                <div style={terminalHeaderStyle}>
                  <span style={terminalDotStyle} />
                  <span style={terminalDotStyle} />
                  <span style={terminalDotStyle} />
                  <span style={{ marginLeft: 8, color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>parser terminal</span>
                </div>
                <div style={syntaxChipRailStyle}>
                  {QUICK_SYNTAX.map((line) => (
                    <button key={line} type="button" onClick={() => setSource((current) => `${current.trimEnd()}\n${line}`)} style={syntaxChipStyle}>
                      {line}
                    </button>
                  ))}
                </div>
                <textarea value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} style={editorStyle} />

                {(runtimeError || catalogError || simulation?.warnings.length) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                    {runtimeError && <RuntimeNotice tone="danger" text={runtimeError} />}
                    {catalogError && <RuntimeNotice tone="danger" text={catalogError} />}
                    {simulation?.warnings.map((warning) => (
                      <RuntimeNotice key={warning} tone="warning" text={warning} />
                    ))}
                  </div>
                )}

                <div className="workspace-support-grid" style={{ marginTop: 12 }}>
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
          </div>
        </section>

        <div className="workspace-resizer" onPointerDown={handleResizeStart} title="Resize inspector" />

        <aside className="workspace-pane workspace-right-pane" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
          <SectionCard
            title="Inspector"
            subtitle="Inspect state, Bloch vectors, analysis, and model-specific docs from here."
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
            {activeInspector === "docs" && <DocsPanel syntax={catalog?.syntax ?? []} templates={filteredTemplates} notes={catalog?.architecture_notes ?? []} context={inspectorContext} />}
            {activeInspector === "analysis" && <WorkspaceAnalysisPanel />}
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

// ── Styles ────────────────────────────────────────────────────────────────────

const pageShellStyle: CSSProperties = {
  height: "100%",
  minHeight: 0,
  padding: "16px",
  paddingTop: 56,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  overflow: "auto",
}

const topNavStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: 56,
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  paddingInline: 16,
  gap: 12,
  borderBottom: "1px solid var(--border)",
  background: "var(--bg-panel)",
  boxShadow: "var(--shadow-card)",
}

const navHamburgerStyle: CSSProperties = {
  width: 38,
  height: 38,
  flexShrink: 0,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--text-primary)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}

const navWorkspaceLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "var(--font-mono)",
  color: "var(--text-primary)",
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
}

const navCenterStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  justifyContent: "center",
}

const navTitleButtonStyle: CSSProperties = {
  maxWidth: "min(58vw, 640px)",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}

const titleTooltipStyle: CSSProperties = {
  maxWidth: 440,
  borderRadius: "var(--radius-md)",
  border: "1px solid #283247",
  background: "#171d2c",
  color: "#d7dfef",
  padding: "10px 12px",
  fontSize: 12,
  lineHeight: 1.65,
  boxShadow: "var(--shadow-card)",
}

const navControlsStyle: CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  alignItems: "center",
  gap: 6,
}

const headerExecButtonStyle: CSSProperties = {
  height: 34,
  padding: "0 10px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
}

const drawerOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.5)",
  zIndex: 40,
}

const drawerContentStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  top: 0,
  bottom: 0,
  width: "min(420px, 92vw)",
  zIndex: 45,
  background: "var(--bg-panel)",
  borderRight: "1px solid var(--border)",
  padding: "18px 14px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  overflowY: "auto",
}

const drawerHeaderStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "12px",
}

const drawerSectionStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
}

const drawerAccordionTriggerStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  fontWeight: 700,
}

const drawerAccordionContentStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "0 10px 10px",
}

const drawerTemplateButtonStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-active)",
  padding: "8px 10px",
  textAlign: "left",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text-primary)",
}

const drawerActionLinkStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "10px 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  color: "var(--text-primary)",
  textDecoration: "none",
}

const drawerActionButtonStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  color: "var(--button-primary-text)",
  padding: "10px 12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontWeight: 700,
}

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.55)",
  zIndex: 50,
}

const benchmarkModalStyle: CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(920px, 94vw)",
  maxHeight: "86vh",
  overflowY: "auto",
  zIndex: 55,
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 14,
}

const benchmarkStatsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 10,
}

const benchmarkRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-active)",
  padding: "10px 12px",
}

const benchmarkBarTrackStyle: CSSProperties = {
  height: 8,
  borderRadius: 999,
  background: "rgba(88, 164, 146, 0.15)",
  overflow: "hidden",
}

const benchmarkBarFillStyle: CSSProperties = {
  height: "100%",
  background: "var(--accent-cyan)",
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

const stackedWorkspaceShellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  flex: 1,
  width: "100%",
  height: "100%",
  minHeight: 0,
}

const splitWorkspaceHostStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  width: "100%",
  display: "flex",
}

const stackedTopPaneStyle: CSSProperties = {
  flex: "1 1 58%",
  minHeight: 320,
}

const terminalPaneStyle: CSSProperties = {
  flex: "1 1 42%",
  borderRadius: "var(--radius-lg)",
  border: "1px solid #2a2f3f",
  background: "#111622",
  padding: "10px 10px 12px",
  display: "flex",
  flexDirection: "column",
  minHeight: 260,
}

const terminalHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: "1px solid #232b3d",
}

const terminalDotStyle: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 999,
  background: "#4a556f",
}

const syntaxChipRailStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 12,
}

const syntaxChipStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid #2f3a53",
  background: "#171d2c",
  color: "#a5b4d6",
  padding: "6px 10px",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
}

const editorStyle: CSSProperties = {
  width: "100%",
  minHeight: 220,
  resize: "vertical",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  lineHeight: 1.75,
  background: "#0b101a",
  color: "#d4def4",
  border: "1px solid #2a3248",
  borderRadius: "var(--radius-md)",
  padding: "14px",
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

