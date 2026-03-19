
import type { LayoutNode } from "@/lib/qdd/layout"

interface Props { node: LayoutNode; x: number; y: number }

export function QDDNodeViz({ node, x, y }: Props) {
  if (node.isTerminal) {
    const mag = node.value ? Math.sqrt(node.value.re**2 + node.value.im**2) : 0
    const alpha = Math.min(1, mag + 0.15)
    return (
      <g>
        <rect x={x - 16} y={y - 10} width={32} height={20} rx={4}
          fill={`rgba(16,185,129,${alpha * 0.15})`}
          stroke="var(--accent-green)" strokeWidth={1.2}/>
        <text x={x} y={y + 4} textAnchor="middle"
          fontSize={8} fontFamily="var(--font-mono)" fill="var(--accent-green)" fontWeight={600}>
          {mag.toFixed(2)}
        </text>
      </g>
    )
  }

  return (
    <g>
      {/* Outer glow ring */}
      <circle cx={x} cy={y} r={15}
        fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.2)" strokeWidth={0.5}/>
      {/* Main node */}
      <circle cx={x} cy={y} r={11}
        fill="var(--bg-card)" stroke="var(--accent-purple)" strokeWidth={1.5}/>
      <text x={x} y={y + 4} textAnchor="middle"
        fontSize={9} fontFamily="var(--font-mono)" fill="var(--accent-purple)" fontWeight={600}>
        {node.label}
      </text>
    </g>
  )
}
