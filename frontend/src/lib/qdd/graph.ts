
export interface QDDNode {
  id: string
  level: number
  label: string
  isTerminal: boolean
  value?: { re: number; im: number }
}

export interface QDDEdge {
  from: string
  to: string
  branch: 0 | 1
  weight: { re: number; im: number }
}

export interface QDDGraph {
  nodes: QDDNode[]
  edges: QDDEdge[]
  nQubits: number
  nodeCount: number
  fullSize: number
}

export function parseQDDResponse(raw: unknown): QDDGraph {
  return raw as QDDGraph
}

export function compressionRatio(graph: QDDGraph): number {
  return graph.nodeCount / graph.fullSize
}

// Generate a synthetic QDD for a given circuit state (for demo/preview)
export function syntheticQDD(nQubits: number, circuitType: "bell" | "ghz" | "random" | "grover" = "random"): QDDGraph {
  const nodes: QDDNode[] = []
  const edges: QDDEdge[] = []

  if (circuitType === "bell" && nQubits === 2) {
    // Bell state: exactly 2 terminal nodes, very compressed
    nodes.push({ id: "q0", level: 0, label: "q0", isTerminal: false })
    nodes.push({ id: "q1a", level: 1, label: "q1", isTerminal: false })
    nodes.push({ id: "q1b", level: 1, label: "q1", isTerminal: false })
    nodes.push({ id: "t0", level: 2, label: "0", isTerminal: true, value: { re: 0, im: 0 } })
    nodes.push({ id: "t1", level: 2, label: "1", isTerminal: true, value: { re: 0.707, im: 0 } })
    edges.push({ from: "q0", to: "q1a", branch: 0, weight: { re: 1, im: 0 } })
    edges.push({ from: "q0", to: "q1b", branch: 1, weight: { re: 1, im: 0 } })
    edges.push({ from: "q1a", to: "t1", branch: 0, weight: { re: 0.707, im: 0 } })
    edges.push({ from: "q1a", to: "t0", branch: 1, weight: { re: 0, im: 0 } })
    edges.push({ from: "q1b", to: "t0", branch: 0, weight: { re: 0, im: 0 } })
    edges.push({ from: "q1b", to: "t1", branch: 1, weight: { re: 0.707, im: 0 } })
    return { nodes, edges, nQubits: 2, nodeCount: 5, fullSize: 4 }
  }

  if (circuitType === "ghz") {
    // GHZ: highly compressed — only 2 terminal nodes regardless of n
    const root = { id: "n0", level: 0, label: "q0", isTerminal: false }
    nodes.push(root)
    let prev = root
    for (let i = 1; i < nQubits; i++) {
      const nb = { id: `n${i}a`, level: i, label: `q${i}`, isTerminal: false }
      nodes.push(nb)
      edges.push({ from: prev.id, to: nb.id, branch: 0, weight: { re: 0.707, im: 0 } })
      prev = nb
    }
    nodes.push({ id: "t0", level: nQubits, label: "0", isTerminal: true, value: { re: 0, im: 0 } })
    nodes.push({ id: "t1", level: nQubits, label: "1", isTerminal: true, value: { re: 0.707, im: 0 } })
    edges.push({ from: prev.id, to: "t0", branch: 0, weight: { re: 0.707, im: 0 } })
    edges.push({ from: prev.id, to: "t1", branch: 1, weight: { re: 0.707, im: 0 } })
    return { nodes, edges, nQubits, nodeCount: nQubits + 2, fullSize: 1 << nQubits }
  }

  // Generic random / Grover — realistic partial compression
  const compressionFactor = circuitType === "grover" ? 0.35 : 0.55
  const targetNodes = Math.max(nQubits + 2, Math.floor((1 << nQubits) * compressionFactor))

  // Build layered graph
  const nodesPerLevel: string[][] = []
  for (let lvl = 0; lvl <= nQubits; lvl++) {
    const isTerminal = lvl === nQubits
    const count = isTerminal
      ? Math.max(2, Math.min(4, Math.floor(targetNodes * 0.3)))
      : Math.max(1, Math.min(Math.floor(targetNodes / (nQubits + 1)), 4))

    const levelNodes: string[] = []
    for (let i = 0; i < count; i++) {
      const id = isTerminal ? `t${i}` : `n${lvl}_${i}`
      const mag = isTerminal ? (Math.random() * 0.8 + 0.1) : 0
      nodes.push({
        id, level: lvl,
        label: isTerminal ? mag.toFixed(2) : `q${lvl}`,
        isTerminal,
        value: isTerminal ? { re: mag, im: 0 } : undefined,
      })
      levelNodes.push(id)
    }
    nodesPerLevel.push(levelNodes)
  }

  // Connect levels
  for (let lvl = 0; lvl < nQubits; lvl++) {
    const from = nodesPerLevel[lvl]
    const to   = nodesPerLevel[lvl + 1]
    for (const fid of from) {
      const t0 = to[Math.floor(Math.random() * to.length)]
      const t1 = to[Math.floor(Math.random() * to.length)]
      const w = Math.random() * 0.6 + 0.2
      edges.push({ from: fid, to: t0, branch: 0, weight: { re: w, im: 0 } })
      edges.push({ from: fid, to: t1, branch: 1, weight: { re: Math.sqrt(1 - w*w), im: 0 } })
    }
  }

  return { nodes, edges, nQubits, nodeCount: nodes.length, fullSize: 1 << nQubits }
}
