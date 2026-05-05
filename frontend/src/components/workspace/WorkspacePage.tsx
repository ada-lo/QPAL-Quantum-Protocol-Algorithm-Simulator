import * as Dialog from "@radix-ui/react-dialog"
import { UserButton } from "@neondatabase/neon-js/auth/react/ui"
import { BookOpenText, Cpu, House, Info, Menu, MoreHorizontal, Play, RefreshCw, RotateCcw, Search, StepForward, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Editor } from "@monaco-editor/react"

import { LearningStudioPanel } from "@/components/learning/LearningStudioPanel"
import { AppModeToggle } from "@/components/shared/AppModeToggle"
import { useThemeMode } from "@/hooks/useThemeMode"
import { setStoredAppMode } from "@/lib/appMode"
import { LEARNING_EXPERIENCES, type LearningExperience } from "@/lib/quantum/learningCatalog"
import { PRESETS, type CircuitPreset } from "@/lib/quantum/presets"
import { fetchPublicWorkspaceCatalog, runWorkspaceBenchmarks, simulateWorkspaceProgram } from "@/lib/workspace/api"
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
import { useSimStore } from "@/store/simStore"
import { AlgorithmSettingsPanel, BlochInspector, StateInspector } from "./WorkspaceInspectors"
import WorkspaceAnalysisPanel from "./WorkspaceAnalysisPanel"
import { WorkspaceCircuitBuilder } from "./WorkspaceCircuitBuilder"
import { PreFlightModal } from "./PreFlightModal"
import { StepWalkthroughModal } from "./StepWalkthroughModal"

const DEFAULT_PROGRAM = ``







const INSPECTOR_TABS = [
  { id: "studio", label: "Studio 3D" },
  { id: "state", label: "State" },
  { id: "bloch", label: "Bloch" },
  { id: "analysis", label: "Analysis" },
] as const
const STUDIO_ALIASES: Record<string, string> = {
  bb84_eavesdrop: "bb84",
  teleportation_simplified: "teleport",
  superdense_simplified: "superdense",
  grover_starter: "grover",
  grover_search: "grover",
  qft_signal: "qft",
  qft_3qubit: "qft",
  qaoa_round: "qaoa",
  qaoa_maxcut: "qaoa",
  qft3: "qft",
  superpos: "qwalk",
  quantum_walk_1d: "qwalk",
  vqe_h2: "vqe",
  qpe_simple: "qpe",
  shor_factorization: "shor",
  deutsch_jozsa: "dj",
  bernstein_vazirani: "bv",
  qec_3qubit_repetition: "qec",
}


type InspectorTab = (typeof INSPECTOR_TABS)[number]["id"]
type TemplateCategoryFilter = "all" | "algorithm" | "protocol"

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

function matchesTemplateFilter(template: WorkspaceTemplate, query: string, category: TemplateCategoryFilter) {
  const normalizedQuery = normalizeToken(query)
  const inCategory = category === "all" || template.kind === category
  if (!inCategory) return false
  if (!normalizedQuery) return true
  const haystack = [template.id, template.title, template.description, ...template.tags].map(normalizeToken).join(" ")
  return haystack.includes(normalizedQuery)
}

export function WorkspacePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [source, setSource] = useState(DEFAULT_PROGRAM)
  const [catalog, setCatalog] = useState<WorkspaceCatalogResponse | null>(null)
  const [simulation, setSimulation] = useState<WorkspaceSimulationResponse | null>(null)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [validationFailed, setValidationFailed] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [benchmarks, setBenchmarks] = useState<WorkspaceBenchmarkResponse | null>(null)
  const [benchmarking, setBenchmarking] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [activeInspector, setActiveInspector] = useState<InspectorTab>("state")
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false)
  const [selectedModelValue, setSelectedModelValue] = useState("")
  const [presetPickerValue, setPresetPickerValue] = useState("")
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false)
  const [templateSearch, setTemplateSearch] = useState("")
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<TemplateCategoryFilter>("all")
  const [rightPaneWidth, setRightPaneWidth] = useState(430)
  const { theme, setTheme } = useThemeMode()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const executionTokenRef = useRef(0)
  const requestedTemplateRef = useRef<string | null>(null)
  const injectedSourceLockRef = useRef<string | null>(null)
  // Sync guard: set to true while the parser is writing to the circuit store
  // so the Visual→Text effect ignores that echo update.
  const isParserWritingRef = useRef(false)
  const isCircuitWritingRef = useRef(false)

  const selectLearningExperience = useLearningStore((state) => state.select)
  const loadLearningCircuit = useLearningStore((state) => state.loadIntoCircuit)
  const loadPreset = useCircuitStore((state) => state.loadPreset)
  const circuitQubitCount = useCircuitStore((state) => state.nQubits)
  const circuitGates = useCircuitStore((state) => state.gates)
  const circuitInitialStates = useCircuitStore((state) => state.initialStates)

  const preflightOpen = useSimStore((s) => s.preflightOpen)
  const setPreflightOpen = useSimStore((s) => s.setPreflightOpen)
  const setSystemHardware = useSimStore((s) => s.setSystemHardware)
  const walkthroughOpen = useSimStore((s) => s.walkthroughOpen)
  const setWalkthroughOpen = useSimStore((s) => s.setWalkthroughOpen)
  const walkthroughStep = useSimStore((s) => s.walkthroughStep)
  const setWalkthroughStep = useSimStore((s) => s.setWalkthroughStep)
  const openForWalkthrough = useSimStore((s) => s.openForWalkthrough)
  const setOpenForWalkthrough = useSimStore((s) => s.setOpenForWalkthrough)
  const applySimulationResponse = useSimStore((s) => s.applySimulationResponse)
  const loadTemplate = useSimStore((s) => s.loadTemplate)
  const engine = useSimStore((s) => s.engine)
  const setEngine = useSimStore((s) => s.setEngine)
  const setActiveTemplateContext = useSimStore((s) => s.setActiveTemplateContext)
  const clearActiveTemplateContext = useSimStore((s) => s.clearActiveTemplateContext)
  const activeTemplateCategory = useSimStore((s) => s.activeTemplateCategory)
  const activeTemplateBaseCode = useSimStore((s) => s.activeTemplateBaseCode)

  useEffect(() => {
    setStoredAppMode("researcher")
  }, [])

  // Sync store's template code to editor when it changes (e.g., after engine switch)
  useEffect(() => {
    if (activeTemplateBaseCode !== null) {
      setSource(activeTemplateBaseCode)
    }
  }, [activeTemplateBaseCode])

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
  const presetSelectionOptions = useMemo(() => selectionOptions.filter((option) => option.source === "preset" && option.preset), [selectionOptions])
  const filteredTemplates = useMemo(() => filterRelatedTemplates(selectedModel, catalog?.templates ?? []), [catalog?.templates, selectedModel])
  const filteredBenchmarks = useMemo(() => filterRelatedBenchmarks(selectedModel, catalog?.benchmarks ?? []), [catalog?.benchmarks, selectedModel])
  const categorizedTemplates = useMemo(
    () => ({
      algorithms: (catalog?.templates ?? []).filter((template) => template.kind === "algorithm"),
      protocols: (catalog?.templates ?? []).filter((template) => template.kind === "protocol"),
    }),
    [catalog?.templates],
  )
  const visibleTemplates = useMemo(
    () => (catalog?.templates ?? []).filter((template) => matchesTemplateFilter(template, templateSearch, templateCategoryFilter)),
    [catalog?.templates, templateCategoryFilter, templateSearch],
  )
  const templateById = useMemo(() => {
    const entries = (catalog?.templates ?? []).map((template) => [template.id, template] as const)
    return new Map(entries)
  }, [catalog?.templates])
  const parsed = useMemo(() => {
    if (engine === "custom") {
      return parsePseudoProgram(source)
    } else {
      return { errors: [], warnings: [], instructions: [], qubits: [], actors: [] }
    }
  }, [source, engine])
  const canSyncCircuit = engine === "custom" && parsed.errors.length === 0
  const selectedStep = simulation?.steps[Math.min(activeStep, Math.max(simulation.steps.length - 1, 0))] ?? null
  const selectedState = selectedStep?.state ?? null
  const inspectorContext = selectedModel
    ? { title: selectedModel.title, description: selectedModel.description, kind: selectedModel.kindLabel }
    : null

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      try {
        const response = await fetchPublicWorkspaceCatalog()
        if (!active) return
        setCatalog(response)
        setCatalogError(null)
      } catch (error) {
        if (!active) return
        setCatalogError(error instanceof Error ? error.message : "Unable to load workspace catalog.")
      }
    }

    // Non-blocking: detect host hardware for the pre-flight modal
    async function detectHardware() {
      try {
        const result = await runWorkspaceBenchmarks([])
        if (active) setSystemHardware(result.capabilities)
      } catch {
        // Silently ignore – hardware panel falls back to placeholder labels
      }
    }

    loadCatalog()
    void detectHardware()

    return () => {
      active = false
    }
  }, [])







  useEffect(() => {
    const templateId = searchParams.get("template")
    if (!templateId || requestedTemplateRef.current === templateId) return
    const template = templateById.get(templateId)
    if (!template) return
    requestedTemplateRef.current = templateId
    applyTemplateById(templateId)
    navigate("/workspace", { replace: true })
  }, [navigate, searchParams, templateById])

  useEffect(() => {
    const injectedState = location.state as {
      circuit?: string
      format?: "openqasm" | "qunetsim" | "custom"
      category?: "algorithm" | "protocol" | null
      templateId?: string
    } | null
    if (!injectedState?.circuit) return

    injectedSourceLockRef.current = injectedState.circuit
    const injectedEngine = injectedState.format ?? "custom"
    const injectedCategory = injectedState.category ?? (injectedEngine === "qunetsim" ? "protocol" : injectedEngine === "openqasm" ? "algorithm" : null)
    const injectedTemplate = injectedState.templateId ? templateById.get(injectedState.templateId) ?? null : null
    if (injectedTemplate) {
      setActiveTemplateContext(injectedTemplate, injectedEngine, injectedState.circuit)
    } else {
      clearActiveTemplateContext(injectedEngine, injectedCategory)
    }
    if (injectedState.templateId) {
      setSelectedModelValue(`template:${injectedState.templateId}`)
    }
    setSource(injectedState.circuit)
    navigate("/workspace", { replace: true, state: null })
  }, [clearActiveTemplateContext, location.state, navigate, setActiveTemplateContext, templateById])

  // Simulation is only triggered by explicit user action (Run button).
  // No auto-run on source change.


  // Visual → Text: when the user edits the circuit grid, regenerate pseudocode.
  // Bails immediately if the parser was the one that just wrote the circuit.
  useEffect(() => {
    if (engine !== "custom") return
    if (injectedSourceLockRef.current) return
    if (isParserWritingRef.current) return
    const nextSource = circuitSnapshotToProgram({
      nQubits: circuitQubitCount,
      gates: circuitGates,
      initialStates: circuitInitialStates,
    })
    isCircuitWritingRef.current = true
    setSource((prev) => (nextSource !== prev ? nextSource : prev))
  }, [circuitQubitCount, circuitGates, circuitInitialStates, engine, setEngine])

  // Text → Visual: parse instructions and push to circuit store.
  // Sets isParserWritingRef so the reverse effect doesn't echo back.
  useEffect(() => {
    if (isCircuitWritingRef.current) {
      isCircuitWritingRef.current = false
      return
    }
    if (!canSyncCircuit) return
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
    if (injectedSourceLockRef.current === source) {
      injectedSourceLockRef.current = null
    }
    queueMicrotask(() => {
      isParserWritingRef.current = false
    })
  }, [canSyncCircuit, parsed.instructions, circuitQubitCount, circuitGates, circuitInitialStates, source])

  async function executeProgram(code: string) {
    const executionToken = executionTokenRef.current + 1
    executionTokenRef.current = executionToken
    setRunning(true)

    // Read execution config from store at call time
    const { noiseModel: nm, computeTarget: ct, engine } = useSimStore.getState()

    try {
      const response = await simulateWorkspaceProgram(code, engine, {
        noiseModel: nm === 'ideal' ? undefined : nm,
        preferGpu: ct === 'gpu',
      })
      if (executionToken !== executionTokenRef.current) return
      setSimulation(response)
      applySimulationResponse(response, response.engine || engine)
      setRuntimeError(null)
      setActiveStep(Math.max(response.steps.length - 1, 0))

      // Auto-open walkthrough if requested via the Step button gatekeeper
      if (openForWalkthrough) {
        setWalkthroughStep(0)
        setWalkthroughOpen(true)
        setOpenForWalkthrough(false)
      }
    } catch (error) {
      if (executionToken !== executionTokenRef.current) return
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
    setActiveInspector("state")
    setValidationFailed(false)
    setRuntimeError(null)

    if (!source.trim()) {
      setRuntimeError("Code cannot be empty.")
      return false
    }

    // Guard: Block execution if frontend parser found syntax errors
    if (parsed.errors.length > 0) {
      setRuntimeError("Please fix syntax errors before running.")
      return false
    }

    const { templateParams } = useSimStore.getState()
    const hasEmptyParams = Object.values(templateParams).some((v) => v === "" || v === null || v === undefined)

    if (hasEmptyParams || source.includes("{{")) {
      setValidationFailed(true)
      setRuntimeError("Error: Please provide valid inputs for all template parameters.")
      return false
    }

    return await executeProgram(source)
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

  function applyPresetSelection(option: WorkspaceModelOption) {
    if (!option.preset) return

    setSelectedModelValue(option.value)
    setActiveInspector("studio")

    if (option.studioId) {
      selectLearningExperience(option.studioId)
    }

    loadPreset(option.preset.gates, option.preset.nQubits)
    setSource(
      circuitSnapshotToProgram({
        nQubits: option.preset.nQubits,
        gates: option.preset.gates.map((gate, index) => ({ ...gate, id: `preset-${option.preset?.id}-${index}` })),
        initialStates: Array.from({ length: option.preset.nQubits }, () => "|0⟩" as const),
      }),
    )
  }

  function applySelection(option: WorkspaceModelOption) {
    if (option.preset) {
      applyPresetSelection(option)
      return
    }

    setSelectedModelValue(option.value)

    if (option.studioId) {
      selectLearningExperience(option.studioId)
      setActiveInspector("studio")
    } else {
      setActiveInspector("state")
    }

    if (option.source === "template" && option.template) {
      setTemplateDrawerOpen(false)
      loadTemplate(option.template).then(hydrated => setSource(hydrated))
      return
    }

    const templateMatch = findRelatedTemplate(option, catalog?.templates ?? [])
    if (templateMatch) {
      setTemplateDrawerOpen(false)
      loadTemplate(templateMatch).then(hydrated => setSource(hydrated))
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
    // Fast path: option already in selectionOptions (catalog loaded)
    const option = selectionOptions.find((item) => item.value === `template:${templateId}`)
    if (option) {
      applySelection(option)
      return
    }
    // Fallback: catalog may still be loading — load directly from the catalog map
    const template = templateById.get(templateId)
    if (template) {
      loadTemplate(template).then(hydrated => setSource(hydrated))
    }
    // If neither is available yet, delay close so the user can see the item is pending
  }

  function handleStepExecution() {
    setValidationFailed(false)
    setRuntimeError(null)

    if (!source.trim()) return

    const { templateParams } = useSimStore.getState()
    const hasEmptyParams = Object.values(templateParams).some((v) => v === "" || v === null || v === undefined)

    if (hasEmptyParams || source.includes("{{")) {
      setValidationFailed(true)
      setRuntimeError("Error: Please provide valid inputs for all template parameters.")
      return
    }

    if (!simulation || simulation.steps.length === 0) {
      // Set the flag so Run immediately opens walkthrough, then open Run modal
      setOpenForWalkthrough(true)
      setPreflightOpen(true)
      return
    }
    // Simulation exists: jump straight to Walkthrough Debugger, starting at step 0
    setWalkthroughStep(0)
    setWalkthroughOpen(true)
  }

  function handleResetExecution() {
    setActiveStep(0)
    setRuntimeError(null)
  }

  return (
    <div style={pageShellStyle}>
      <nav style={topNavStyle}>
        <button type="button" style={navHamburgerStyle} onClick={() => setTemplateDrawerOpen(true)} aria-label="Open workspace menu">
          <Menu size={18} />
        </button>
        <div style={navControlsStyle}>
          <Link to="/" style={headerLinkButtonStyle}>
            <House size={14} />
            Home
          </Link>
          <button
            type="button"
            style={{ ...headerExecButtonStyle, borderColor: "var(--accent-green)", color: "var(--accent-green)" }}
            onClick={() => setPreflightOpen(true)}
            disabled={!source.trim() || running}
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
        </div>
        <div style={{ flex: 1 }} />
        <div style={navControlsStyle}>
          <AppModeToggle />
          <ThemeToggleButton label="Dark" active={theme === "dark"} onClick={() => setTheme("dark")} />
          <ThemeToggleButton label="Light" active={theme === "light"} onClick={() => setTheme("light")} />
          <Link to="/explore" style={headerLinkButtonStyle}>
            <BookOpenText size={14} />
            Explore
          </Link>
          <div style={authUserButtonShellStyle}>
            <UserButton />
          </div>
        </div>
      </nav>

      <Dialog.Root open={templateDrawerOpen} onOpenChange={setTemplateDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={modalOverlayStyle} />
          <Dialog.Content style={templateDrawerStyle}>
            <div style={templateDrawerHeaderStyle}>
              <div>
                <div style={eyebrowStyle}>WORKSPACE MENU</div>
                <Dialog.Title style={{ fontSize: 20, marginBottom: 4 }}>Algorithms and protocols</Dialog.Title>
                <Dialog.Description style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Change templates without leaving the workspace.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button type="button" style={drawerCloseButtonStyle} aria-label="Close workspace menu">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            <div style={templateSearchShellStyle}>
              <Search size={15} style={{ color: "var(--text-muted)" }} />
              <input
                value={templateSearch}
                onChange={(event) => setTemplateSearch(event.target.value)}
                placeholder="Search templates"
                style={templateSearchInputStyle}
              />
            </div>

            <div style={drawerFilterRailStyle}>
              {(["all", "algorithm", "protocol"] as const).map((filterValue) => (
                <button
                  key={filterValue}
                  type="button"
                  onClick={() => setTemplateCategoryFilter(filterValue)}
                  style={{
                    ...drawerFilterButtonStyle,
                    borderColor: templateCategoryFilter === filterValue ? "var(--accent-cyan)" : "var(--border)",
                    background: templateCategoryFilter === filterValue ? "var(--bg-active)" : "transparent",
                    color: templateCategoryFilter === filterValue ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  {filterValue === "all" ? "All" : filterValue === "algorithm" ? "Algorithms" : "Protocols"}
                </button>
              ))}
            </div>

            <div style={workspaceCategoryBadgeRailStyle}>
              <span style={workspaceCategoryBadgeStyle}>{categorizedTemplates.algorithms.length} algorithms</span>
              <span style={workspaceCategoryBadgeStyle}>{categorizedTemplates.protocols.length} protocols</span>
            </div>

            <div style={templateDrawerListStyle}>
              {visibleTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  style={{
                    ...drawerTemplateButtonStyle,
                    borderColor: selectedModelValue === `template:${template.id}` ? "var(--accent-cyan)" : "var(--border)",
                  }}
                  onClick={() => applyTemplateById(template.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div>
                      <div style={drawerTemplateMetaStyle}>{template.kind}</div>
                      <strong>{template.title}</strong>
                    </div>
                    <span style={drawerTemplateIdStyle}>{template.id}</span>
                  </div>
                  <div style={drawerTemplateBodyStyle}>{template.description}</div>
                </button>
              ))}
              {visibleTemplates.length === 0 && <div style={drawerEmptyStateStyle}>No templates matched this filter.</div>}
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

      <PreFlightModal
        open={preflightOpen}
        onOpenChange={(open) => {
          setPreflightOpen(open)
          if (!open) setOpenForWalkthrough(false) // clear flag if user cancels
        }}
        onConfirm={handleRunWorkspace}
        loading={running}
      />

      {/* ── Step-by-Step Debugger modal ── */}
      {simulation && (
        <StepWalkthroughModal
          open={walkthroughOpen}
          onOpenChange={setWalkthroughOpen}
          steps={simulation.steps}
          currentStep={walkthroughStep}
          onStepChange={setWalkthroughStep}
          onFinish={() => {
            setWalkthroughOpen(false)
            setActiveInspector("state")
          }}
        />
      )}



      <div ref={containerRef} className="workspace-main" style={{ "--workspace-right-width": `${rightPaneWidth}px` } as CSSProperties}>
        <section className="workspace-pane workspace-left-pane">

          <div style={splitWorkspaceHostStyle}>
            <div style={stackedWorkspaceShellStyle}>
              <div style={stackedTopPaneStyle}>
                <WorkspaceCircuitBuilder canSync={canSyncCircuit} />
              </div>
              <div style={terminalPaneStyle}>
                <AlgorithmSettingsPanel onUpdateSource={setSource} validationFailed={validationFailed} />

                <div style={editorHeaderStyle}>
                  <select
                    value={engine}
                    onChange={(event) => setEngine(event.target.value as "custom" | "openqasm" | "qunetsim")}
                    style={engineSelectStyle}
                    aria-label="Execution engine"
                  >
                    <option value="custom">QPAL Parser</option>
                    {activeTemplateCategory !== 'protocol' && <option value="openqasm">OpenQASM 3.0</option>}
                    {activeTemplateCategory !== 'algorithm' && <option value="qunetsim">QuNetSim</option>}
                  </select>
                  <div style={editorHeaderIconsStyle}>
                    <button type="button" aria-label="Editor info" style={editorHeaderIconButtonStyle}>
                      <Info size={14} />
                    </button>
                    <button type="button" aria-label="Editor options" style={editorHeaderIconButtonStyle}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid #2a3248" }}>
                  <Editor
                    height="220px"
                    language={engine === "qunetsim" ? "python" : engine === "openqasm" ? "c" : "plaintext"}
                    theme={theme === "dark" ? "vs-dark" : "light"}
                    value={source}
                    onChange={(val) => setSource(val ?? "")}
                    options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "var(--font-mono)", padding: { top: 12 }, scrollBeyondLastLine: false }}
                  />
                </div>

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
            subtitle="Inspect state, Bloch vectors, and analysis from here."
            style={{ display: "flex", flexDirection: "column" }}
            action={
              <div style={tabRailStyle}>
                {INSPECTOR_TABS.filter((tab) => tab.id !== "studio" || selectedModel?.studioId).map((tab) => (
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
            {activeInspector === "state" && <StateInspector state={selectedState} instructions={simulation?.steps.length ? simulation.steps.map(s => s.instruction) : parsed.instructions} stepLabel={selectedStep?.event ?? "No active step"} />}
            {activeInspector === "bloch" && <BlochInspector state={selectedState} />}
            {activeInspector === "analysis" && (
              <WorkspaceAnalysisPanel
                presetLabel={selectedModel?.title ?? null}
                presetGates={selectedModel?.preset?.gates ?? null}
                presetQubits={selectedModel?.preset?.nQubits ?? null}
              />
            )}
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

const headerLinkButtonStyle: CSSProperties = {
  ...headerExecButtonStyle,
  textDecoration: "none",
}

const authUserButtonShellStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
}

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  color: "var(--button-primary-text)",
  fontWeight: 700,
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
  background: "rgba(122, 223, 196, 0.12)",
  overflow: "hidden",
}

const benchmarkBarFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-green))",
}

const splitWorkspaceHostStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  flex: 1,
  gap: 14,
}

const stackedWorkspaceShellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  minHeight: 0,
}

const stackedTopPaneStyle: CSSProperties = {
  minHeight: 0,
}

const terminalPaneStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-panel)",
  padding: 14,
  minHeight: 0,
}

const editorHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
}

const engineSelectStyle: CSSProperties = {
  minWidth: 180,
  height: 36,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  padding: "0 12px",
}

const editorHeaderIconsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
}

const editorHeaderIconButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}

const sectionCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-panel)",
  padding: 16,
  minHeight: 0,
}

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
}

const tabRailStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
}

const tabButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 600,
}

const supportPanelStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  padding: "14px",
  minHeight: 0,
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
}

const templateDrawerStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: "min(420px, 92vw)",
  zIndex: 55,
  borderRight: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  boxShadow: "var(--shadow-card)",
}

const templateDrawerHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
}

const drawerCloseButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}

const workspaceCategoryBadgeRailStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
}

const workspaceCategoryBadgeStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  padding: "6px 10px",
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
}

const templateSearchShellStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "0 12px",
  minHeight: 42,
}

const templateSearchInputStyle: CSSProperties = {
  flex: 1,
  border: "none",
  background: "transparent",
  color: "var(--text-primary)",
  outline: "none",
  fontSize: 13,
}

const drawerFilterRailStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
}

const drawerFilterButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
  background: "transparent",
}

const templateDrawerListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  overflowY: "auto",
  paddingRight: 4,
}

const drawerTemplateButtonStyle: CSSProperties = {
  textAlign: "left",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
}

const drawerTemplateMetaStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  marginBottom: 4,
}

const drawerTemplateIdStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
}

const drawerTemplateBodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  fontSize: 13,
}

const drawerEmptyStateStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px dashed var(--border)",
  padding: 18,
  color: "var(--text-secondary)",
  textAlign: "center",
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



