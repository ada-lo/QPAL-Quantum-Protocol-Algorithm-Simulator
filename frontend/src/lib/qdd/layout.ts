
import type { QDDGraph, QDDNode } from "./graph"

export interface LayoutNode extends QDDNode {
  x: number
  y: number
}

export interface QDDLayout {
  nodes: LayoutNode[]
  edges: QDDGraph["edges"]
  width: number
  height: number
}

export function layoutQDD(graph: QDDGraph, width = 300, rowHeight = 72): QDDLayout {
  const byLevel = new Map<number, QDDNode[]>()
  for (const node of graph.nodes) {
    const lvl = node.level
    if (!byLevel.has(lvl)) byLevel.set(lvl, [])
    byLevel.get(lvl)!.push(node)
  }

  const layoutNodes: LayoutNode[] = []
  const maxLevel = Math.max(...byLevel.keys())
  const usableW = width - 40

  for (const [level, nodes] of byLevel.entries()) {
    const n = nodes.length
    nodes.forEach((node, i) => {
      const x = n === 1
        ? width / 2
        : 20 + (i / (n - 1)) * usableW
      const y = 30 + level * rowHeight
      layoutNodes.push({ ...node, x, y })
    })
  }

  return {
    nodes: layoutNodes,
    edges: graph.edges,
    width,
    height: 30 + (maxLevel + 1) * rowHeight + 30,
  }
}
