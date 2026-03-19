
import { useRef, useState } from "react"
import { useCircuitStore } from "@/store/circuitStore"
import { GATES, TWO_QUBIT_GATES, type GateId } from "@/lib/quantum/gates"

const CELL_W = 44
const CELL_H = 48
const QUBIT_LABEL_W = 36
const PAD_LEFT = 12
const PAD_TOP = 16
const MAX_STEPS = 24

function isConnectingGate(id: GateId) {
  return TWO_QUBIT_GATES.includes(id as any)
}

export function CircuitGrid() {
  const {
    nQubits, gates, selectedGate, addGate, removeGate,
    pendingConnection, setPendingConnection, setHoveredCell, hoveredCell,
  } = useCircuitStore()

  const totalW = PAD_LEFT + QUBIT_LABEL_W + MAX_STEPS * CELL_W + 20
  const totalH = PAD_TOP + nQubits * CELL_H + 20

  function handleCellClick(qubit: number, step: number) {
    if (!selectedGate) return
    const occupied = gates.some(g => g.qubit === qubit && g.step === step)

    if (isConnectingGate(selectedGate)) {
      if (!pendingConnection) {
        // First click = control qubit
        if (!occupied) setPendingConnection({ gateId: selectedGate, controlQubit: qubit, step })
      } else if (pendingConnection.step === step && qubit !== pendingConnection.controlQubit) {
        // Second click = target qubit (same step, different qubit)
        if (!occupied) {
          addGate({
            gateId: pendingConnection.gateId,
            qubit: Math.min(qubit, pendingConnection.controlQubit),
            step,
            targetQubit: Math.max(qubit, pendingConnection.controlQubit),
          })
        }
        setPendingConnection(null)
      } else {
        setPendingConnection(null)
      }
    } else {
      if (!occupied) addGate({ gateId: selectedGate, qubit, step })
    }
  }

  return (
    <div style={{ overflowX: "auto", overflowY: "visible", padding: "8px 0" }}>
      <svg
        width={totalW} height={totalH}
        style={{ display: "block", cursor: selectedGate ? "crosshair" : "default" }}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* ── Qubit labels & wires ── */}
        {Array.from({ length: nQubits }, (_, q) => {
          const cy = PAD_TOP + q * CELL_H + CELL_H / 2
          const x0 = PAD_LEFT + QUBIT_LABEL_W
          const x1 = PAD_LEFT + QUBIT_LABEL_W + MAX_STEPS * CELL_W
          return (
            <g key={q}>
              {/* Label */}
              <text x={PAD_LEFT + QUBIT_LABEL_W - 6} y={cy + 4}
                textAnchor="end" fontSize={11} fontFamily="var(--font-mono)"
                fill="var(--text-muted)">
                q{q}
              </text>
              {/* Wire */}
              <line x1={x0} y1={cy} x2={x1} y2={cy}
                stroke="var(--border-bright)" strokeWidth={1} />
            </g>
          )
        })}

        {/* ── Step column highlights ── */}
        {Array.from({ length: MAX_STEPS }, (_, s) => {
          const x = PAD_LEFT + QUBIT_LABEL_W + s * CELL_W
          const isHover = hoveredCell?.step === s
          return (
            <rect key={s} x={x + 2} y={PAD_TOP} width={CELL_W - 4}
              height={nQubits * CELL_H}
              fill={isHover ? "var(--bg-hover)" : "transparent"}
              rx={4}
              style={{ transition: "fill 0.1s" }}
            />
          )
        })}

        {/* ── Click target cells ── */}
        {Array.from({ length: nQubits }, (_, q) =>
          Array.from({ length: MAX_STEPS }, (_, s) => {
            const cx = PAD_LEFT + QUBIT_LABEL_W + s * CELL_W + CELL_W / 2
            const cy = PAD_TOP + q * CELL_H + CELL_H / 2
            const isPending = pendingConnection?.step === s && pendingConnection?.controlQubit === q
            return (
              <rect key={`${q}-${s}`}
                x={cx - CELL_W/2 + 2} y={cy - CELL_H/2 + 4}
                width={CELL_W - 4} height={CELL_H - 8}
                fill="transparent" rx={4}
                style={{ cursor: selectedGate ? "pointer" : "default" }}
                onClick={() => handleCellClick(q, s)}
                onMouseEnter={() => setHoveredCell({ qubit: q, step: s })}
              />
            )
          })
        )}

        {/* ── Pending connection indicator ── */}
        {pendingConnection && (
          <circle
            cx={PAD_LEFT + QUBIT_LABEL_W + pendingConnection.step * CELL_W + CELL_W/2}
            cy={PAD_TOP + pendingConnection.controlQubit * CELL_H + CELL_H/2}
            r={10} fill="none"
            stroke="var(--accent-cyan)" strokeWidth={2}
            strokeDasharray="4,2"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="12" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}

        {/* ── Gates ── */}
        {gates.map(gate => {
          const def = GATES[gate.gateId]
          const cx = PAD_LEFT + QUBIT_LABEL_W + gate.step * CELL_W + CELL_W/2
          const cy = PAD_TOP + gate.qubit * CELL_H + CELL_H/2

          if (gate.targetQubit !== undefined) {
            const cy2 = PAD_TOP + gate.targetQubit * CELL_H + CELL_H/2
            const minY = Math.min(cy, cy2)
            const maxY = Math.max(cy, cy2)
            const isCtrl = gate.qubit < gate.targetQubit
            return (
              <g key={gate.id} onClick={() => removeGate(gate.id)} style={{ cursor: "pointer" }}>
                {/* Connecting line */}
                <line x1={cx} y1={minY} x2={cx} y2={maxY}
                  stroke={def.color} strokeWidth={1.5} />
                {/* Control dot */}
                <circle cx={cx} cy={isCtrl ? cy : cy2} r={5} fill={def.color} />
                {/* Target */}
                {gate.gateId === "CNOT" ? (
                  <g>
                    <circle cx={cx} cy={isCtrl ? cy2 : cy} r={10}
                      fill="var(--bg-card)" stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx-7} y1={isCtrl ? cy2 : cy} x2={cx+7} y2={isCtrl ? cy2 : cy}
                      stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx} y1={(isCtrl ? cy2 : cy)-7} x2={cx} y2={(isCtrl ? cy2 : cy)+7}
                      stroke={def.color} strokeWidth={1.5} />
                  </g>
                ) : (
                  <g>
                    <rect x={cx-14} y={(isCtrl ? cy2 : cy)-12} width={28} height={24}
                      rx={4} fill="var(--bg-card)" stroke={def.color} strokeWidth={1.5} />
                    <text x={cx} y={(isCtrl ? cy2 : cy)+4} textAnchor="middle"
                      fontSize={10} fontWeight={700} fontFamily="var(--font-mono)"
                      fill={def.color}>{def.label}</text>
                  </g>
                )}
              </g>
            )
          }

          // Single qubit gate
          return (
            <g key={gate.id} onClick={() => removeGate(gate.id)} style={{ cursor: "pointer" }}>
              <rect x={cx-14} y={cy-12} width={28} height={24} rx={4}
                fill={def.color} stroke="none" />
              {/* Glow */}
              <rect x={cx-14} y={cy-12} width={28} height={24} rx={4}
                fill="none" stroke={def.color} strokeWidth={0.5} opacity={0.5} />
              <text x={cx} y={cy+4} textAnchor="middle"
                fontSize={gate.gateId === "TOFFOLI" ? 8 : 10}
                fontWeight={700} fontFamily="var(--font-mono)" fill="#fff">
                {def.label}
              </text>
            </g>
          )
        })}

        {/* ── Hover ghost gate ── */}
        {hoveredCell && selectedGate && !pendingConnection && (() => {
          const { qubit: q, step: s } = hoveredCell
          const occupied = gates.some(g => g.qubit === q && g.step === s)
          if (occupied) return null
          const def = GATES[selectedGate]
          const cx = PAD_LEFT + QUBIT_LABEL_W + s * CELL_W + CELL_W/2
          const cy = PAD_TOP + q * CELL_H + CELL_H/2
          return (
            <g opacity={0.35} style={{ pointerEvents: "none" }}>
              <rect x={cx-14} y={cy-12} width={28} height={24} rx={4}
                fill={def.color} />
              <text x={cx} y={cy+4} textAnchor="middle" fontSize={10}
                fontWeight={700} fontFamily="var(--font-mono)" fill="#fff">
                {def.label}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
