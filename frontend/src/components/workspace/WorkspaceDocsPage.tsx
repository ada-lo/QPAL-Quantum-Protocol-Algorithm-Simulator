import { SignedIn, SignedOut, UserButton } from "@neondatabase/neon-js/auth/react/ui"
import { ArrowLeft, MoonStar, SunMedium } from "lucide-react"
import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { Link } from "react-router-dom"

import { SignOutButton } from "@/components/auth/SignOutButton"
import { useThemeMode } from "@/hooks/useThemeMode"
import { fetchPublicWorkspaceCatalog } from "@/lib/workspace/api"
import type { WorkspaceCatalogResponse, WorkspaceSyntaxItem, WorkspaceTemplate } from "@/lib/workspace/types"

const SYNTAX_CATEGORY_ORDER = ["quantum", "actor", "transport", "annotation", "macro"] as const

export function WorkspaceDocsPage() {
  const { theme, setTheme } = useThemeMode()
  const [catalog, setCatalog] = useState<WorkspaceCatalogResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadCatalog() {
      try {
        const response = await fetchPublicWorkspaceCatalog()
        if (!active) return
        setCatalog(response)
        setError(null)
      } catch (fetchError) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load catalog.")
      }
    }
    void loadCatalog()
    return () => {
      active = false
    }
  }, [])

  const algorithms = useMemo(() => (catalog?.templates ?? []).filter((template) => template.kind === "algorithm"), [catalog?.templates])
  const protocols = useMemo(() => (catalog?.templates ?? []).filter((template) => template.kind === "protocol"), [catalog?.templates])
  const syntaxGroups = useMemo(() => {
    const grouped = new Map<string, WorkspaceSyntaxItem[]>()
    for (const item of catalog?.syntax ?? []) {
      const bucket = grouped.get(item.category) ?? []
      bucket.push(item)
      grouped.set(item.category, bucket)
    }
    return SYNTAX_CATEGORY_ORDER
      .map((category) => ({
        category,
        items: grouped.get(category) ?? [],
      }))
      .filter((group) => group.items.length > 0)
  }, [catalog?.syntax])

  return (
    <div style={docsShellStyle}>
      <header style={docsHeaderStyle}>
        <div style={{ maxWidth: 860 }}>
          <div style={eyebrowStyle}>QPAL DOCS</div>
          <h1 style={{ fontSize: "clamp(1.8rem, 2.6vw, 2.6rem)", marginBottom: 10 }}>QPAL Documentation</h1>
          <p style={heroBodyStyle}>
            This page explains what each part of QPAL does, how the parser reads your program, and when to use an
            algorithm or a communication protocol. It is written for users who are new to the workspace and need more
            than just a card title.
          </p>
        </div>
        <div style={headerActionsStyle}>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            style={{ ...themeButtonStyle, borderColor: theme === "dark" ? "var(--accent-cyan)" : "var(--border)", background: theme === "dark" ? "var(--bg-active)" : "var(--bg-card)" }}
          >
            <MoonStar size={14} />
            Dark
          </button>
          <button
            type="button"
            onClick={() => setTheme("light")}
            style={{ ...themeButtonStyle, borderColor: theme === "light" ? "var(--accent-cyan)" : "var(--border)", background: theme === "light" ? "var(--bg-active)" : "var(--bg-card)" }}
          >
            <SunMedium size={14} />
            Light
          </button>
          <SignedOut>
            <Link to="/login" style={primaryActionStyle}>
              Sign in
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/workspace" style={backButtonStyle}>
              <ArrowLeft size={14} />
              Back to workspace
            </Link>
            <SignOutButton style={backButtonStyle} />
            <div style={authUserButtonShellStyle}>
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </header>

      {error && <div style={noticeStyle}>{error}</div>}

      <section style={heroGridStyle}>
        <article style={featurePanelStyle}>
          <div style={eyebrowStyle}>What QPAL Is</div>
          <h2 style={sectionHeroTitleStyle}>A workspace for writing, visualizing, and simulating quantum ideas</h2>
          <p style={bodyCopyStyle}>
            QPAL supports two main styles of work. Algorithms focus on gates, qubits, and measurement flow inside a
            circuit. Protocols focus on actors such as Alice, Bob, and Eve, plus qubit transfer, interception, and
            communication events between them.
          </p>
          <div style={calloutGridStyle}>
            <div style={calloutCardStyle}>
              <div style={miniLabelStyle}>Algorithms</div>
              <div style={calloutTitleStyle}>Circuit-first quantum computation</div>
              <div style={calloutTextStyle}>Best for oracles, phase logic, search, transforms, and measurement-driven decision problems.</div>
            </div>
            <div style={calloutCardStyle}>
              <div style={miniLabelStyle}>Protocols</div>
              <div style={calloutTitleStyle}>Party-to-party quantum communication</div>
              <div style={calloutTextStyle}>Best for teleportation, QKD, entanglement sharing, message transfer, and adversary scenarios.</div>
            </div>
          </div>
        </article>

        <article style={featurePanelStyle}>
          <div style={eyebrowStyle}>How To Read The Workspace</div>
          <div style={guideListStyle}>
            <GuideRow
              title="Editor"
              body="You write instructions here. QPAL accepts its own simplified parser syntax, and some templates switch to OpenQASM or QuNetSim when that engine is a better fit."
            />
            <GuideRow
              title="Parser Feedback"
              body="Before the backend runs anything, the frontend parser checks the text, points to line errors, and warns you when a macro expands into lower-level instructions."
            />
            <GuideRow
              title="Structured JSON"
              body="This is the parser's internal view of your program. It helps you understand how the app interpreted each line."
            />
            <GuideRow
              title="Inspector"
              body="Use the state, Bloch, and analysis tabs to inspect what the program produced after simulation."
            />
          </div>
        </article>
      </section>

      <section style={docsSectionStyle}>
        <div style={sectionHeaderBlockStyle}>
          <div style={eyebrowStyle}>Parser Guide</div>
          <h2 style={sectionTitleStyle}>What the QPAL parser does</h2>
          <p style={sectionLeadStyle}>
            The parser is the first layer that reads your program line by line. Its job is to translate readable QPAL
            commands into structured instructions the workspace can validate, visualize, and send to the backend.
          </p>
        </div>

        <div style={calloutGridStyle}>
          <div style={infoCardStyle}>
            <div style={miniLabelStyle}>Step 1</div>
            <h3 style={infoCardTitleStyle}>Checks syntax before execution</h3>
            <p style={bodyCopyStyle}>
              If a command is invalid, missing a qubit, or uses the wrong number of arguments, the parser flags the
              exact line so users can fix the text before they run a simulation.
            </p>
          </div>
          <div style={infoCardStyle}>
            <div style={miniLabelStyle}>Step 2</div>
            <h3 style={infoCardTitleStyle}>Builds a structured instruction list</h3>
            <p style={bodyCopyStyle}>
              Every valid line becomes a normalized instruction with fields like opcode, qubits, actors, basis, and
              metadata. That is what powers the JSON preview and the visual circuit sync.
            </p>
          </div>
          <div style={infoCardStyle}>
            <div style={miniLabelStyle}>Step 3</div>
            <h3 style={infoCardTitleStyle}>Expands macros into simpler operations</h3>
            <p style={bodyCopyStyle}>
              Commands like <code>SUPERPOSE</code> and <code>BELL</code> are shortcuts. The parser expands them into
              lower-level steps and reports that expansion as a warning so the user still knows what really ran.
            </p>
          </div>
        </div>

        <div style={twoColumnGridStyle}>
          <article style={subPanelStyle}>
            <div style={eyebrowStyle}>Why It Matters</div>
            <div style={guideListStyle}>
              <GuideRow title="For beginners" body="You can write readable commands such as `ACTOR Alice` or `SEND q0 Alice Bob` instead of starting with more complex formal syntax." />
              <GuideRow title="For debugging" body="The parser separates text mistakes from simulation mistakes, which makes it much easier to understand why a program is failing." />
              <GuideRow title="For visualization" body="The same parsed instructions are used to populate the circuit builder, timeline, and state inspectors." />
            </div>
          </article>

          <article style={subPanelStyle}>
            <div style={eyebrowStyle}>Quick Examples</div>
            <div style={exampleBlockStyle}>
              <div style={exampleTitleStyle}>Simple algorithm</div>
              <pre style={codeBlockStyle}>{`INIT q0
H q0
MEASURE q0 BASIS Z`}</pre>
              <div style={exampleNoteStyle}>Creates one qubit, puts it in superposition, then measures it in the Z basis.</div>
            </div>
            <div style={exampleBlockStyle}>
              <div style={exampleTitleStyle}>Simple protocol</div>
              <pre style={codeBlockStyle}>{`ACTOR Alice
ACTOR Bob
INIT q0
ASSIGN q0 Alice
SEND q0 Alice Bob`}</pre>
              <div style={exampleNoteStyle}>Registers two actors, gives Alice a qubit, and records a transfer from Alice to Bob.</div>
            </div>
          </article>
        </div>
      </section>

      {!!(catalog?.architecture_notes?.length || 0) && (
        <section style={docsSectionStyle}>
          <div style={sectionHeaderBlockStyle}>
            <div style={eyebrowStyle}>System Notes</div>
            <h2 style={sectionTitleStyle}>How QPAL is organized behind the scenes</h2>
          </div>
          <div style={notesGridStyle}>
            {catalog?.architecture_notes.map((note) => (
              <article key={note} style={noteCardStyle}>
                <p style={bodyCopyStyle}>{note}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section style={docsSectionStyle}>
        <div style={sectionHeaderBlockStyle}>
          <div style={eyebrowStyle}>Command Reference</div>
          <h2 style={sectionTitleStyle}>Parser syntax by category</h2>
          <p style={sectionLeadStyle}>
            The categories below show what each command is for, how it is written, and when a first-time user would
            choose it.
          </p>
        </div>

        <div style={syntaxGroupStackStyle}>
          {syntaxGroups.map((group) => (
            <article key={group.category} style={syntaxGroupCardStyle}>
              <div style={syntaxGroupHeaderStyle}>
                <div>
                  <div style={miniLabelStyle}>{group.category.toUpperCase()}</div>
                  <h3 style={infoCardTitleStyle}>{getCategoryHeading(group.category)}</h3>
                </div>
                <p style={syntaxGroupSummaryStyle}>{getCategorySummary(group.category)}</p>
              </div>
              <div style={syntaxItemsGridStyle}>
                {group.items.map((item) => (
                  <div key={`${item.category}-${item.syntax}`} style={syntaxItemCardStyle}>
                    <div style={syntaxLineStyle}>{item.syntax}</div>
                    <p style={bodyCopyStyle}>{item.description}</p>
                    {item.example && <div style={syntaxMetaStyle}>Example: {item.example}</div>}
                    {item.expands_to?.length ? <div style={syntaxMetaStyle}>Expands to: {item.expands_to.join(" -> ")}</div> : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={docsSectionStyle}>
        <div style={sectionHeaderBlockStyle}>
          <div style={eyebrowStyle}>Catalog</div>
          <h2 style={sectionTitleStyle}>Algorithms explained</h2>
          <p style={sectionLeadStyle}>
            These entries are not just names. Each one is a runnable example or starter model that helps users connect
            a concept to a circuit they can inspect in the workspace.
          </p>
        </div>
        <div style={cardGridStyle}>
          {algorithms.map((template) => (
            <TemplateDocCard key={template.id} template={template} />
          ))}
        </div>
      </section>

      <section style={docsSectionStyle}>
        <div style={sectionHeaderBlockStyle}>
          <div style={eyebrowStyle}>Catalog</div>
          <h2 style={sectionTitleStyle}>Protocols explained</h2>
          <p style={sectionLeadStyle}>
            Protocols are useful when the story matters as much as the gate sequence. They usually involve different
            parties, moving qubits, and sometimes an adversary or interception step.
          </p>
        </div>
        <div style={cardGridStyle}>
          {protocols.map((template) => (
            <TemplateDocCard key={template.id} template={template} />
          ))}
        </div>
      </section>
    </div>
  )
}

function GuideRow({ title, body }: { title: string; body: string }) {
  return (
    <div style={guideRowStyle}>
      <div style={guideTitleStyle}>{title}</div>
      <div style={guideBodyStyle}>{body}</div>
    </div>
  )
}

function TemplateDocCard({ template }: { template: WorkspaceTemplate }) {
  const difficultyTag = template.tags.find((tag) => tag.startsWith("difficulty:"))
  const difficulty = difficultyTag ? difficultyTag.replace("difficulty:", "") : null

  return (
    <article style={docCardStyle}>
      <div style={docCardTopStyle}>
        <div>
          <div style={eyebrowStyle}>{template.kind === "algorithm" ? "Algorithm" : "Protocol"}</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>{template.title}</h3>
        </div>
        {difficulty ? <span style={tagPillStyle}>{difficulty}</span> : null}
      </div>
      <p style={bodyCopyStyle}>{template.description}</p>
      <div style={templatePurposeStyle}>{describeTemplatePurpose(template)}</div>
      <div style={tagRailStyle}>
        {template.tags.slice(0, 4).map((tag) => (
          <span key={tag} style={tagPillStyle}>
            {tag.replace("difficulty:", "level:")}
          </span>
        ))}
      </div>
    </article>
  )
}

function getCategoryHeading(category: string) {
  switch (category) {
    case "quantum":
      return "Qubit operations and measurements"
    case "actor":
      return "Actors and ownership"
    case "transport":
      return "Communication and interception"
    case "annotation":
      return "Timeline and readability helpers"
    case "macro":
      return "Shortcuts that expand into multiple steps"
    default:
      return "Reference"
  }
}

function getCategorySummary(category: string) {
  switch (category) {
    case "quantum":
      return "Use these when you want to build or measure a quantum state directly."
    case "actor":
      return "Use these to describe who owns a qubit and which parties exist in the scenario."
    case "transport":
      return "Use these when qubits move between parties or an eavesdropper intervenes."
    case "annotation":
      return "Use these to label, separate, and explain steps without changing the quantum state."
    case "macro":
      return "Use these as readable shortcuts when you do not want to type every primitive operation."
    default:
      return ""
  }
}

function describeTemplatePurpose(template: WorkspaceTemplate) {
  if (template.kind === "protocol") {
    return "Why a user would open this: to study the flow between parties, see where quantum information moves, and inspect measurements or transport events step by step."
  }
  return "Why a user would open this: to inspect the gate sequence, understand the role of each qubit, and connect the theory to a runnable circuit inside the workspace."
}

const docsShellStyle: CSSProperties = {
  minHeight: "100%",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 18,
}

const docsHeaderStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: "22px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
}

const heroBodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.75,
  fontSize: "1rem",
  maxWidth: 760,
}

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
}

const heroGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
  gap: 18,
}

const featurePanelStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 16,
}

const docsSectionStyle: CSSProperties = {
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: 18,
}

const sectionHeaderBlockStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  maxWidth: 900,
}

const sectionHeroTitleStyle: CSSProperties = {
  fontSize: "clamp(1.4rem, 2vw, 2rem)",
  lineHeight: 1.2,
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 24,
  lineHeight: 1.2,
}

const sectionLeadStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.7,
}

const bodyCopyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.7,
}

const calloutGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
}

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
}

const notesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
}

const syntaxGroupStackStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
}

const syntaxGroupCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 14,
}

const syntaxGroupHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
}

const syntaxGroupSummaryStyle: CSSProperties = {
  color: "var(--text-secondary)",
  maxWidth: 420,
  lineHeight: 1.65,
}

const syntaxItemsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
}

const syntaxItemCardStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const syntaxLineStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  color: "var(--accent-cyan)",
  fontSize: 13,
  wordBreak: "break-word",
}

const syntaxMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  lineHeight: 1.5,
}

const calloutCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const calloutTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
}

const calloutTextStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.65,
}

const infoCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
}

const infoCardTitleStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1.25,
}

const subPanelStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 14,
}

const noteCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: 16,
}

const guideListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const guideRowStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "12px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
}

const guideTitleStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
}

const guideBodyStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.65,
}

const exampleBlockStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const exampleTitleStyle: CSSProperties = {
  fontWeight: 700,
}

const exampleNoteStyle: CSSProperties = {
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  fontSize: 13,
}

const codeBlockStyle: CSSProperties = {
  margin: 0,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "rgba(8, 12, 20, 0.82)",
  padding: 12,
  fontSize: 12,
  lineHeight: 1.7,
  color: "#d8e5f3",
  fontFamily: "var(--font-mono)",
  overflowX: "auto",
}

const cardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
}

const docCardStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const docCardTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
}

const templatePurposeStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  padding: "10px 12px",
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  fontSize: 13,
}

const tagRailStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
}

const tagPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  border: "1px solid var(--border)",
  padding: "6px 10px",
  background: "var(--bg-elevated)",
  color: "var(--text-muted)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
}

const primaryActionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--accent-cyan)",
  background: "var(--accent-cyan)",
  padding: "8px 12px",
  color: "var(--button-primary-text)",
  textDecoration: "none",
  fontWeight: 700,
}

const backButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  padding: "8px 12px",
  color: "var(--text-primary)",
  textDecoration: "none",
}

const themeButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  padding: "8px 12px",
  fontWeight: 700,
}

const authUserButtonShellStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
}

const noticeStyle: CSSProperties = {
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--accent-red)",
  color: "var(--accent-red)",
  background: "var(--bg-card)",
  padding: "10px 12px",
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  marginBottom: 8,
}

const miniLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
}
