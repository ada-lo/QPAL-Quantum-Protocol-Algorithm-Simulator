import * as Dialog from "@radix-ui/react-dialog"
import * as Tabs from "@radix-ui/react-tabs"
import { Check, Copy } from "lucide-react"
import { useMemo, useState, type CSSProperties } from "react"

import type { WorkspaceTemplate } from "@/lib/workspace/types"

const OPENQASM_SNIPPET = `OPENQASM 3.0;
include "stdgates.inc";
qubit[2] q;
bit[2] c;

h q[0];
cx q[0], q[1];
measure q -> c;`

const QUNETSIM_SNIPPET = `from qunetsim.components import Host, Network
from qunetsim.objects import Qubit

network = Network.get_instance()
network.start()

alice = Host('Alice')
bob = Host('Bob')
network.add_hosts([alice, bob])

q = Qubit(alice)
q.H()
alice.send_qubit(bob.host_id, q)`

export function DocumentationModal({
  open,
  onOpenChange,
  templates,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: WorkspaceTemplate[]
}) {
  const [copied, setCopied] = useState<"qasm" | "qunetsim" | null>(null)

  const algorithms = useMemo(() => templates.filter((template) => template.kind === "algorithm"), [templates])
  const protocols = useMemo(() => templates.filter((template) => template.kind === "protocol"), [templates])

  const handleCopy = (type: "qasm" | "qunetsim", text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle} />
        <Dialog.Content style={contentStyle}>
          <div style={headerStyle}>
            <div>
              <div style={eyebrowStyle}>DOCUMENTATION</div>
              <Dialog.Title style={titleStyle}>Algorithms, Protocols, and Syntax</Dialog.Title>
              <Dialog.Description style={descStyle}>
                Browse available templates and language references in one place.
              </Dialog.Description>
            </div>
            <button onClick={() => onOpenChange(false)} style={closeBtnStyle} aria-label="Close documentation">
              ×
            </button>
          </div>

          <Tabs.Root defaultValue="algorithms" style={tabsRootStyle}>
            <Tabs.List style={tabsListStyle}>
              <Tabs.Trigger value="algorithms" style={tabsTriggerStyle}>Algorithms</Tabs.Trigger>
              <Tabs.Trigger value="protocols" style={tabsTriggerStyle}>Protocols</Tabs.Trigger>
              <Tabs.Trigger value="syntax" style={tabsTriggerStyle}>Language Syntax</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="algorithms" style={tabsContentStyle}>
              <div style={descStyle}>Available algorithm templates in this workspace.</div>
              <TemplateDirectory templates={algorithms} emptyLabel="No algorithms are currently available." />
            </Tabs.Content>

            <Tabs.Content value="protocols" style={tabsContentStyle}>
              <div style={descStyle}>Available protocol templates in this workspace.</div>
              <TemplateDirectory templates={protocols} emptyLabel="No protocols are currently available." />
            </Tabs.Content>

            <Tabs.Content value="syntax" style={tabsContentStyle}>
              <div style={descStyle}>Use OpenQASM for algorithm-style circuits and QuNetSim/Python for network protocols.</div>
              <div style={syntaxGridStyle}>
                <div style={fullExampleStyle}>
                  <div style={exampleHeaderStyle}>
                    <span style={exampleEyebrowStyle}>OpenQASM 3.0</span>
                    <button style={copyBtnStyle} onClick={() => handleCopy("qasm", OPENQASM_SNIPPET)} aria-label="Copy OpenQASM example">
                      {copied === "qasm" ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre style={preStyle}>{OPENQASM_SNIPPET}</pre>
                </div>

                <div style={fullExampleStyle}>
                  <div style={exampleHeaderStyle}>
                    <span style={exampleEyebrowStyle}>QuNetSim / Python</span>
                    <button style={copyBtnStyle} onClick={() => handleCopy("qunetsim", QUNETSIM_SNIPPET)} aria-label="Copy QuNetSim example">
                      {copied === "qunetsim" ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre style={preStyle}>{QUNETSIM_SNIPPET}</pre>
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function TemplateDirectory({ templates, emptyLabel }: { templates: WorkspaceTemplate[]; emptyLabel: string }) {
  if (templates.length === 0) {
    return <div style={emptyStateStyle}>{emptyLabel}</div>
  }

  return (
    <div style={directoryGridStyle}>
      {templates.map((template) => (
        <article key={template.id} style={directoryCardStyle}>
          <div style={cardMetaStyle}>{template.id}</div>
          <h3 style={cardTitleStyle}>{template.title}</h3>
          <p style={cardDescriptionStyle}>{template.description}</p>
        </article>
      ))}
    </div>
  )
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  zIndex: 60,
}

const contentStyle: CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(780px, 96vw)",
  maxHeight: "90vh",
  zIndex: 65,
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--border)",
  background: "linear-gradient(180deg, var(--bg-panel), var(--bg-elevated))",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  overflowY: "auto",
}

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
}

const closeBtnStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: 4,
  fontSize: 20,
  lineHeight: 1,
}

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  marginBottom: 6,
}

const titleStyle: CSSProperties = { fontSize: 20, marginBottom: 4 }

const descStyle: CSSProperties = { color: "var(--text-secondary)", lineHeight: 1.6, fontSize: 13 }

const tabsRootStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 14 }

const tabsListStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  borderBottom: "1px solid var(--border)",
  paddingBottom: 8,
}

const tabsTriggerStyle: CSSProperties = {
  background: "#131a2a",
  border: "1px solid #283247",
  borderRadius: "var(--radius-sm)",
  padding: "7px 12px",
  color: "var(--text-secondary)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
}

const tabsContentStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const directoryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 10,
}

const directoryCardStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid #283247",
  background: "#111622",
  padding: "12px",
}

const cardMetaStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "var(--text-muted)",
  marginBottom: 8,
}

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  color: "#d4def4",
}

const cardDescriptionStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#a5b4d6",
  fontSize: 13,
  lineHeight: 1.6,
}

const emptyStateStyle: CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--bg-card)",
  color: "var(--text-secondary)",
  padding: "14px",
}

const syntaxGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
}

const fullExampleStyle: CSSProperties = {
  background: "#111622",
  border: "1px solid #2a2f3f",
  borderRadius: "var(--radius-md)",
  overflow: "hidden",
}

const exampleHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  borderBottom: "1px solid #2a2f3f",
  background: "#171d2c",
}

const exampleEyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "var(--text-muted)",
}

const copyBtnStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--text-secondary)",
  cursor: "pointer",
  padding: 4,
  display: "flex",
}

const preStyle: CSSProperties = {
  padding: "12px",
  margin: 0,
  color: "#d4def4",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  overflowX: "auto",
}
