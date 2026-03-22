import { useCircuitStore, type CircuitGate } from "@/store/circuitStore"
import { GATES, TWO_QUBIT_GATES, THREE_QUBIT_GATES, type GateId } from "@/lib/quantum/gates"
import { useSimStore } from "@/store/simStore"
import { useMemo } from "react"
import { InlineDisplay } from "./InlineDisplay"
import { InitialStateIndicator } from "./InitialStateIndicator"

const CELL_W = 52
const CELL_H = 48
const QUBIT_LABEL_W = 56
const PAD_LEFT = 8
const PAD_TOP = 16
const MAX_STEPS = 24

function isConnectingGate(id: GateId) {
  return TWO_QUBIT_GATES.includes(id) || THREE_QUBIT_GATES.includes(id)
}

function isDisplayGate(id: GateId) {
  return ['CHANCE', 'AMPS', 'BLOCH', 'DENSITY'].includes(id)
}

export function CircuitGrid() {
  const {
    nQubits, gates, selectedGate, addGate, removeGate, moveGate,
    pendingConnection, setPendingConnection, setHoveredCell, hoveredCell,
    dragState, setDragState, pushHistory, initialStates,
  } = useCircuitStore()

  const snapshots = useSimStore(s => s.snapshots)

  const totalW = PAD_LEFT + QUBIT_LABEL_W + MAX_STEPS * CELL_W + 20
  const totalH = PAD_TOP + nQubits * CELL_H + 20

  // Precompute gate map for quick lookup
  const gateMap = useMemo(() => {
    const map = new Map<string, CircuitGate>()
    for (const g of gates) {
      map.set(`${g.qubit}-${g.step}`, g)
    }
    return map
  }, [gates])

  // Get columns that have display gates
  const displayColumns = useMemo(() => {
    const cols = new Map<number, CircuitGate[]>()
    for (const g of gates) {
      if (isDisplayGate(g.gateId)) {
        if (!cols.has(g.step)) cols.set(g.step, [])
        cols.get(g.step)!.push(g)
      }
    }
    return cols
  }, [gates])

  function handleCellClick(qubit: number, step: number) {
    if (!selectedGate) return
    const key = `${qubit}-${step}`
    const occupied = gateMap.has(key)

    if (isConnectingGate(selectedGate)) {
      if (!pendingConnection) {
        if (!occupied) setPendingConnection({ gateId: selectedGate, controlQubit: qubit, step })
      } else if (pendingConnection.step === step && qubit !== pendingConnection.controlQubit) {
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
      if (!occupied) {
        addGate({
          gateId: selectedGate, qubit, step,
          angle: GATES[selectedGate].hasAngle ? Math.PI / 2 : undefined,
        })
      }
    }
  }

  // ── Drag & Drop handlers ──
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent, qubit: number, step: number) {
    e.preventDefault()
    const gateId = e.dataTransfer.getData('application/gate-id') as GateId
    const sourceGateId = e.dataTransfer.getData('application/source-gate-id')

    if (sourceGateId) {
      // Moving from circuit
      moveGate(sourceGateId, qubit, step)
    } else if (gateId) {
      // Dropping from toolbox
      const key = `${qubit}-${step}`
      if (!gateMap.has(key)) {
        addGate({
          gateId,
          qubit,
          step,
          angle: GATES[gateId]?.hasAngle ? Math.PI / 2 : undefined,
        })
      }
    }
    setDragState(null)
  }

  function handleGateDragStart(e: React.DragEvent, gate: CircuitGate) {
    e.dataTransfer.setData('application/gate-id', gate.gateId)
    e.dataTransfer.setData('application/source-gate-id', gate.id)
    e.dataTransfer.effectAllowed = 'move'
    setDragState({ gateId: gate.gateId, source: 'circuit', sourceGateId: gate.id })
  }

  function handleGateDragEnd(e: React.DragEvent) {
    // If dropped outside circuit area, remove the gate
    const rect = (e.currentTarget.closest('svg') as SVGElement)?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX, y = e.clientY
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        const sourceGateId = e.dataTransfer.getData('application/source-gate-id')
        if (sourceGateId) removeGate(sourceGateId)
        else if (dragState?.sourceGateId) removeGate(dragState.sourceGateId)
      }
    }
    setDragState(null)
  }

  function handleMiddleClick(e: React.MouseEvent, gateId: string) {
    if (e.button === 1) {
      e.preventDefault()
      removeGate(gateId)
    }
  }

  const svgDraggableProps = { draggable: true } as any

  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible', padding: '8px 0', flex: 1 }}>
      <svg
        width={totalW} height={totalH}
        style={{ display: 'block', cursor: selectedGate || dragState ? 'crosshair' : 'default' }}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* ── Initial state indicators ── */}
        {Array.from({ length: nQubits }, (_, q) => {
          const cy = PAD_TOP + q * CELL_H + CELL_H / 2
          return (
            <foreignObject
              key={`init-${q}`}
              x={PAD_LEFT} y={cy - 12}
              width={QUBIT_LABEL_W - 8} height={24}
            >
              <InitialStateIndicator qubit={q} />
            </foreignObject>
          )
        })}

        {/* ── Qubit wires ── */}
        {Array.from({ length: nQubits }, (_, q) => {
          const cy = PAD_TOP + q * CELL_H + CELL_H / 2
          const x0 = PAD_LEFT + QUBIT_LABEL_W
          const x1 = PAD_LEFT + QUBIT_LABEL_W + MAX_STEPS * CELL_W
          return (
            <line key={`wire-${q}`}
              x1={x0} y1={cy} x2={x1} y2={cy}
              stroke="var(--border-bright)" strokeWidth={1} />
          )
        })}

        {/* ── Step column highlights ── */}
        {Array.from({ length: MAX_STEPS }, (_, s) => {
          const x = PAD_LEFT + QUBIT_LABEL_W + s * CELL_W
          const isHover = hoveredCell?.step === s
          return (
            <rect key={`col-${s}`}
              x={x + 2} y={PAD_TOP}
              width={CELL_W - 4} height={nQubits * CELL_H}
              fill={isHover ? 'var(--bg-hover)' : 'transparent'}
              rx={4}
              style={{ transition: 'fill 0.1s' }}
            />
          )
        })}

        {/* ── Drop target cells ── */}
        {Array.from({ length: nQubits }, (_, q) =>
          Array.from({ length: MAX_STEPS }, (_, s) => {
            const cx = PAD_LEFT + QUBIT_LABEL_W + s * CELL_W + CELL_W / 2
            const cy = PAD_TOP + q * CELL_H + CELL_H / 2
            return (
              <rect key={`cell-${q}-${s}`}
                x={cx - CELL_W / 2 + 2} y={cy - CELL_H / 2 + 4}
                width={CELL_W - 4} height={CELL_H - 8}
                fill="transparent" rx={4}
                style={{ cursor: selectedGate || dragState ? 'pointer' : 'default' }}
                onClick={() => handleCellClick(q, s)}
                onMouseEnter={() => setHoveredCell({ qubit: q, step: s })}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, q, s)}
              />
            )
          })
        )}

        {/* ── Pending connection indicator ── */}
        {pendingConnection && (
          <circle
            cx={PAD_LEFT + QUBIT_LABEL_W + pendingConnection.step * CELL_W + CELL_W / 2}
            cy={PAD_TOP + pendingConnection.controlQubit * CELL_H + CELL_H / 2}
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
          if (!def) return null

          const cx = PAD_LEFT + QUBIT_LABEL_W + gate.step * CELL_W + CELL_W / 2
          const cy = PAD_TOP + gate.qubit * CELL_H + CELL_H / 2

          // ── Display gates ──
          if (def.isDisplay) {
            return (
              <foreignObject
                key={gate.id}
                x={cx - CELL_W / 2 + 4} y={cy - 18}
                width={CELL_W - 8} height={36}
                style={{ cursor: 'pointer' }}
                onClick={() => removeGate(gate.id)}
              >
                <InlineDisplay gateId={gate.gateId} qubit={gate.qubit} step={gate.step} />
              </foreignObject>
            )
          }

          // ── Control pseudo-gates ──
          if (def.isControl) {
            const isFilled = gate.gateId === 'CTRL'
            return (
              <g key={gate.id}
                onClick={() => removeGate(gate.id)}
                onMouseDown={(e) => handleMiddleClick(e as any, gate.id)}
                style={{ cursor: 'pointer' }}
                {...svgDraggableProps}
              >
                <circle cx={cx} cy={cy} r={isFilled ? 6 : 7}
                  fill={isFilled ? '#212121' : 'var(--bg-card)'}
                  stroke={isFilled ? '#fff' : '#BDBDBD'}
                  strokeWidth={1.5} />
                {!isFilled && (
                  <circle cx={cx} cy={cy} r={3} fill="none" stroke="#BDBDBD" strokeWidth={1} />
                )}
              </g>
            )
          }

          // ── Multi-qubit gates ──
          if (gate.targetQubit !== undefined) {
            const cy2 = PAD_TOP + gate.targetQubit * CELL_H + CELL_H / 2
            const minY = Math.min(cy, cy2)
            const maxY = Math.max(cy, cy2)
            const isCtrl = gate.qubit < gate.targetQubit
            return (
              <g key={gate.id}
                onClick={() => removeGate(gate.id)}
                onMouseDown={(e) => handleMiddleClick(e as any, gate.id)}
                style={{ cursor: 'grab' }}
                {...svgDraggableProps}
                onDragStart={(e: any) => handleGateDragStart(e, gate)}
                onDragEnd={(e: any) => handleGateDragEnd(e)}
              >
                <line x1={cx} y1={minY} x2={cx} y2={maxY}
                  stroke={def.color} strokeWidth={1.5} />
                {/* Control dot */}
                <circle cx={cx} cy={isCtrl ? cy : cy2} r={5} fill={def.color} />
                {/* Target */}
                {gate.gateId === 'CNOT' ? (
                  <g>
                    <circle cx={cx} cy={isCtrl ? cy2 : cy} r={12}
                      fill="var(--bg-card)" stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx - 8} y1={isCtrl ? cy2 : cy} x2={cx + 8} y2={isCtrl ? cy2 : cy}
                      stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx} y1={(isCtrl ? cy2 : cy) - 8} x2={cx} y2={(isCtrl ? cy2 : cy) + 8}
                      stroke={def.color} strokeWidth={1.5} />
                  </g>
                ) : gate.gateId === 'SWAP' ? (
                  <g>
                    {/* X marks on both qubits */}
                    <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx + 6} y1={cy - 6} x2={cx - 6} y2={cy + 6} stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx - 6} y1={cy2 - 6} x2={cx + 6} y2={cy2 + 6} stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx + 6} y1={cy2 - 6} x2={cx - 6} y2={cy2 + 6} stroke={def.color} strokeWidth={1.5} />
                  </g>
                ) : (
                  <g>
                    <rect x={cx - 16} y={(isCtrl ? cy2 : cy) - 13} width={32} height={26}
                      rx={4} fill="var(--bg-card)" stroke={def.color} strokeWidth={1.5} />
                    <text x={cx} y={(isCtrl ? cy2 : cy) + 4} textAnchor="middle"
                      fontSize={10} fontWeight={700} fontFamily="var(--font-mono)"
                      fill={def.color}>{def.label}</text>
                  </g>
                )}
              </g>
            )
          }

          // ── Single qubit gates ──
          const isMeasure = gate.gateId === 'MEASURE'
          const gateW = def.label.length > 2 ? 36 : 30
          const gateH = 26

          return (
            <g key={gate.id}
              onClick={() => removeGate(gate.id)}
              onMouseDown={(e) => handleMiddleClick(e as any, gate.id)}
              style={{ cursor: 'grab' }}
              {...svgDraggableProps}
              onDragStart={(e: any) => handleGateDragStart(e, gate)}
              onDragEnd={(e: any) => handleGateDragEnd(e)}
            >
              {isMeasure ? (
                // Measurement gate — meter icon
                <g>
                  <rect x={cx - gateW / 2} y={cy - gateH / 2} width={gateW} height={gateH}
                    rx={4} fill="var(--bg-card)" stroke={def.color} strokeWidth={1.5} />
                  {/* Arc */}
                  <path d={`M${cx - 8} ${cy + 4} Q${cx} ${cy - 8} ${cx + 8} ${cy + 4}`}
                    fill="none" stroke={def.color} strokeWidth={1.2} />
                  {/* Arrow */}
                  <line x1={cx} y1={cy + 4} x2={cx + 5} y2={cy - 6}
                    stroke={def.color} strokeWidth={1.2} />
                </g>
              ) : (
                <g>
                  <rect x={cx - gateW / 2} y={cy - gateH / 2} width={gateW} height={gateH}
                    rx={4} fill={def.color} stroke="none" />
                  <rect x={cx - gateW / 2} y={cy - gateH / 2} width={gateW} height={gateH}
                    rx={4} fill="none" stroke={def.color} strokeWidth={0.5} opacity={0.5} />
                  <text x={cx} y={cy + 4} textAnchor="middle"
                    fontSize={def.label.length > 2 ? 8 : 11}
                    fontWeight={700} fontFamily="var(--font-mono)" fill="#fff">
                    {def.label}
                  </text>
                  {/* Angle label for rotation gates */}
                  {gate.angle !== undefined && (
                    <text x={cx} y={cy + gateH / 2 + 9} textAnchor="middle"
                      fontSize={7} fontFamily="var(--font-mono)"
                      fill="var(--text-muted)">
                      {(gate.angle / Math.PI).toFixed(2)}π
                    </text>
                  )}
                </g>
              )}
            </g>
          )
        })}

        {/* ── Hover ghost gate ── */}
        {hoveredCell && selectedGate && !pendingConnection && (() => {
          const { qubit: q, step: s } = hoveredCell
          const key = `${q}-${s}`
          if (gateMap.has(key)) return null
          const def = GATES[selectedGate]
          if (!def) return null
          const cx = PAD_LEFT + QUBIT_LABEL_W + s * CELL_W + CELL_W / 2
          const cy = PAD_TOP + q * CELL_H + CELL_H / 2
          const gateW = def.label.length > 2 ? 36 : 30
          return (
            <g opacity={0.3} style={{ pointerEvents: 'none' }}>
              <rect x={cx - gateW / 2} y={cy - 13} width={gateW} height={26} rx={4}
                fill={def.color} />
              <text x={cx} y={cy + 4} textAnchor="middle"
                fontSize={def.label.length > 2 ? 8 : 11}
                fontWeight={700} fontFamily="var(--font-mono)" fill="#fff">
                {def.label}
              </text>
            </g>
          )
        })()}

        {/* ── Drop zone indicator when dragging ── */}
        {dragState && hoveredCell && (() => {
          const { qubit: q, step: s } = hoveredCell
          const cx = PAD_LEFT + QUBIT_LABEL_W + s * CELL_W + CELL_W / 2
          const cy = PAD_TOP + q * CELL_H + CELL_H / 2
          return (
            <rect
              x={cx - CELL_W / 2 + 4} y={cy - CELL_H / 2 + 6}
              width={CELL_W - 8} height={CELL_H - 12}
              fill="rgba(0,212,255,0.08)"
              stroke="var(--accent-cyan)"
              strokeWidth={1}
              strokeDasharray="4,2"
              rx={4}
              style={{ pointerEvents: 'none' }}
            />
          )
        })()}
      </svg>
    </div>
  )
}
