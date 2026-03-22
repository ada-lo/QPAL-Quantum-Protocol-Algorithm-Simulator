import { useMemo, type CSSProperties, type DragEvent, type MouseEvent } from "react"

import { GATES, THREE_QUBIT_GATES, TWO_QUBIT_GATES, type GateId } from "@/lib/quantum/gates"
import { useCircuitStore, type CircuitGate } from "@/store/circuitStore"
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
  return ["CHANCE", "AMPS", "BLOCH", "DENSITY"].includes(id)
}

export function CircuitGrid() {
  const {
    nQubits,
    gates,
    selectedGate,
    addGate,
    removeGate,
    moveGate,
    pendingConnection,
    setPendingConnection,
    setHoveredCell,
    hoveredCell,
    dragState,
    setDragState,
  } = useCircuitStore()

  const totalW = PAD_LEFT + QUBIT_LABEL_W + MAX_STEPS * CELL_W + 20
  const totalH = PAD_TOP + nQubits * CELL_H + 20

  const gateMap = useMemo(() => {
    const map = new Map<string, CircuitGate>()
    for (const gate of gates) {
      map.set(`${gate.qubit}-${gate.step}`, gate)
    }
    return map
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
      return
    }

    if (!occupied) {
      addGate({
        gateId: selectedGate,
        qubit,
        step,
        angle: GATES[selectedGate].hasAngle ? Math.PI / 2 : undefined,
      })
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  function handleDrop(event: DragEvent, qubit: number, step: number) {
    event.preventDefault()
    const gateId = event.dataTransfer.getData("application/gate-id") as GateId
    const sourceGateId = event.dataTransfer.getData("application/source-gate-id")

    if (sourceGateId) {
      moveGate(sourceGateId, qubit, step)
    } else if (gateId) {
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

  function handleGateDragStart(event: DragEvent, gate: CircuitGate) {
    event.dataTransfer.setData("application/gate-id", gate.gateId)
    event.dataTransfer.setData("application/source-gate-id", gate.id)
    event.dataTransfer.effectAllowed = "move"
    setDragState({ gateId: gate.gateId, source: "circuit", sourceGateId: gate.id })
  }

  function handleGateDragEnd(event: DragEvent) {
    const rect = (event.currentTarget.closest("svg") as SVGElement | null)?.getBoundingClientRect()
    if (rect) {
      const { clientX: x, clientY: y } = event
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        const sourceGateId = event.dataTransfer.getData("application/source-gate-id")
        if (sourceGateId) removeGate(sourceGateId)
        else if (dragState?.sourceGateId) removeGate(dragState.sourceGateId)
      }
    }
    setDragState(null)
  }

  function handleMiddleClick(event: MouseEvent, gateId: string) {
    if (event.button === 1) {
      event.preventDefault()
      removeGate(gateId)
    }
  }

  const svgDraggableProps = { draggable: true } as const

  return (
    <div style={gridViewportStyle}>
      <svg
        width={totalW}
        height={totalH}
        style={{ display: "block", cursor: selectedGate || dragState ? "crosshair" : "default" }}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {Array.from({ length: nQubits }, (_, qubit) => {
          const cy = PAD_TOP + qubit * CELL_H + CELL_H / 2
          return (
            <foreignObject key={`init-${qubit}`} x={PAD_LEFT} y={cy - 12} width={QUBIT_LABEL_W - 8} height={24}>
              <InitialStateIndicator qubit={qubit} />
            </foreignObject>
          )
        })}

        {Array.from({ length: MAX_STEPS }, (_, step) => {
          const cx = PAD_LEFT + QUBIT_LABEL_W + step * CELL_W + CELL_W / 2
          return (
            <text
              key={`step-label-${step}`}
              x={cx}
              y={12}
              textAnchor="middle"
              fontSize={10}
              fontFamily="var(--font-mono)"
              fill="var(--text-muted)"
            >
              {step + 1}
            </text>
          )
        })}

        {Array.from({ length: nQubits }, (_, qubit) => {
          const cy = PAD_TOP + qubit * CELL_H + CELL_H / 2
          const x0 = PAD_LEFT + QUBIT_LABEL_W
          const x1 = PAD_LEFT + QUBIT_LABEL_W + MAX_STEPS * CELL_W
          return <line key={`wire-${qubit}`} x1={x0} y1={cy} x2={x1} y2={cy} stroke="var(--border-bright)" strokeWidth={1} />
        })}

        {Array.from({ length: MAX_STEPS }, (_, step) => {
          const x = PAD_LEFT + QUBIT_LABEL_W + step * CELL_W
          const isHover = hoveredCell?.step === step
          return (
            <rect
              key={`column-${step}`}
              x={x + 2}
              y={PAD_TOP}
              width={CELL_W - 4}
              height={nQubits * CELL_H}
              fill={isHover ? "var(--bg-hover)" : "transparent"}
              rx={8}
              style={{ transition: "fill 0.1s" }}
            />
          )
        })}

        {Array.from({ length: nQubits }, (_, qubit) =>
          Array.from({ length: MAX_STEPS }, (_, step) => {
            const cx = PAD_LEFT + QUBIT_LABEL_W + step * CELL_W + CELL_W / 2
            const cy = PAD_TOP + qubit * CELL_H + CELL_H / 2
            return (
              <rect
                key={`cell-frame-${qubit}-${step}`}
                x={cx - CELL_W / 2 + 3}
                y={cy - CELL_H / 2 + 5}
                width={CELL_W - 6}
                height={CELL_H - 10}
                rx={8}
                fill="var(--bg-panel)"
                opacity={0.18}
                stroke="var(--border)"
                strokeOpacity={0.32}
              />
            )
          }),
        )}

        {Array.from({ length: nQubits }, (_, qubit) =>
          Array.from({ length: MAX_STEPS }, (_, step) => {
            const cx = PAD_LEFT + QUBIT_LABEL_W + step * CELL_W + CELL_W / 2
            const cy = PAD_TOP + qubit * CELL_H + CELL_H / 2
            return (
              <rect
                key={`cell-hit-${qubit}-${step}`}
                x={cx - CELL_W / 2 + 2}
                y={cy - CELL_H / 2 + 4}
                width={CELL_W - 4}
                height={CELL_H - 8}
                fill="transparent"
                rx={8}
                style={{ cursor: selectedGate || dragState ? "pointer" : "default" }}
                onClick={() => handleCellClick(qubit, step)}
                onMouseEnter={() => setHoveredCell({ qubit, step })}
                onDragOver={handleDragOver}
                onDrop={(event) => handleDrop(event, qubit, step)}
              />
            )
          }),
        )}

        {pendingConnection && (
          <circle
            cx={PAD_LEFT + QUBIT_LABEL_W + pendingConnection.step * CELL_W + CELL_W / 2}
            cy={PAD_TOP + pendingConnection.controlQubit * CELL_H + CELL_H / 2}
            r={10}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth={2}
            strokeDasharray="4,2"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="12" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}

        {gates.map((gate) => {
          const def = GATES[gate.gateId]
          if (!def) return null

          const cx = PAD_LEFT + QUBIT_LABEL_W + gate.step * CELL_W + CELL_W / 2
          const cy = PAD_TOP + gate.qubit * CELL_H + CELL_H / 2

          if (def.isDisplay) {
            return (
              <foreignObject
                key={gate.id}
                x={cx - CELL_W / 2 + 4}
                y={cy - 18}
                width={CELL_W - 8}
                height={36}
                style={{ cursor: "pointer" }}
                onClick={() => removeGate(gate.id)}
              >
                <InlineDisplay gateId={gate.gateId} qubit={gate.qubit} step={gate.step} />
              </foreignObject>
            )
          }

          if (def.isControl) {
            const isFilled = gate.gateId === "CTRL"
            return (
              <g
                key={gate.id}
                onClick={() => removeGate(gate.id)}
                onMouseDown={(event) => handleMiddleClick(event, gate.id)}
                style={{ cursor: "pointer" }}
                {...svgDraggableProps}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isFilled ? 6 : 7}
                  fill={isFilled ? "var(--text-primary)" : "var(--bg-card)"}
                  stroke={isFilled ? "var(--bg-panel)" : "var(--border-bright)"}
                  strokeWidth={1.5}
                />
                {!isFilled && <circle cx={cx} cy={cy} r={3} fill="none" stroke="var(--border-bright)" strokeWidth={1} />}
              </g>
            )
          }

          if (gate.targetQubit !== undefined) {
            const cy2 = PAD_TOP + gate.targetQubit * CELL_H + CELL_H / 2
            const minY = Math.min(cy, cy2)
            const maxY = Math.max(cy, cy2)
            const controlY = gate.qubit < gate.targetQubit ? cy : cy2
            const targetY = gate.qubit < gate.targetQubit ? cy2 : cy

            return (
              <g
                key={gate.id}
                onClick={() => removeGate(gate.id)}
                onMouseDown={(event) => handleMiddleClick(event, gate.id)}
                style={{ cursor: "grab" }}
                {...svgDraggableProps}
                onDragStart={(event) => handleGateDragStart(event, gate)}
                onDragEnd={(event) => handleGateDragEnd(event)}
              >
                <line x1={cx} y1={minY} x2={cx} y2={maxY} stroke={def.color} strokeWidth={1.5} />
                <circle cx={cx} cy={controlY} r={5} fill={def.color} />
                {gate.gateId === "CNOT" ? (
                  <g>
                    <circle cx={cx} cy={targetY} r={12} fill="var(--bg-card)" stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx - 8} y1={targetY} x2={cx + 8} y2={targetY} stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx} y1={targetY - 8} x2={cx} y2={targetY + 8} stroke={def.color} strokeWidth={1.5} />
                  </g>
                ) : gate.gateId === "SWAP" ? (
                  <g>
                    <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx + 6} y1={cy - 6} x2={cx - 6} y2={cy + 6} stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx - 6} y1={cy2 - 6} x2={cx + 6} y2={cy2 + 6} stroke={def.color} strokeWidth={1.5} />
                    <line x1={cx + 6} y1={cy2 - 6} x2={cx - 6} y2={cy2 + 6} stroke={def.color} strokeWidth={1.5} />
                  </g>
                ) : (
                  <g>
                    <rect x={cx - 16} y={targetY - 13} width={32} height={26} rx={6} fill="var(--bg-card)" stroke={def.color} strokeWidth={1.5} />
                    <text
                      x={cx}
                      y={targetY + 4}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={700}
                      fontFamily="var(--font-mono)"
                      fill={def.color}
                    >
                      {def.label}
                    </text>
                  </g>
                )}
              </g>
            )
          }

          const isMeasure = gate.gateId === "MEASURE"
          const gateW = def.label.length > 2 ? 36 : 30
          const gateH = 26

          return (
            <g
              key={gate.id}
              onClick={() => removeGate(gate.id)}
              onMouseDown={(event) => handleMiddleClick(event, gate.id)}
              style={{ cursor: "grab" }}
              {...svgDraggableProps}
              onDragStart={(event) => handleGateDragStart(event, gate)}
              onDragEnd={(event) => handleGateDragEnd(event)}
            >
              {isMeasure ? (
                <g>
                  <rect
                    x={cx - gateW / 2}
                    y={cy - gateH / 2}
                    width={gateW}
                    height={gateH}
                    rx={6}
                    fill="var(--bg-card)"
                    stroke={def.color}
                    strokeWidth={1.5}
                  />
                  <path d={`M${cx - 8} ${cy + 4} Q${cx} ${cy - 8} ${cx + 8} ${cy + 4}`} fill="none" stroke={def.color} strokeWidth={1.2} />
                  <line x1={cx} y1={cy + 4} x2={cx + 5} y2={cy - 6} stroke={def.color} strokeWidth={1.2} />
                </g>
              ) : (
                <g>
                  <rect x={cx - gateW / 2} y={cy - gateH / 2} width={gateW} height={gateH} rx={6} fill={def.color} stroke="none" />
                  <rect
                    x={cx - gateW / 2}
                    y={cy - gateH / 2}
                    width={gateW}
                    height={gateH}
                    rx={6}
                    fill="none"
                    stroke={def.color}
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fontSize={def.label.length > 2 ? 8 : 11}
                    fontWeight={700}
                    fontFamily="var(--font-mono)"
                    fill="#ffffff"
                  >
                    {def.label}
                  </text>
                  {gate.angle !== undefined && (
                    <text
                      x={cx}
                      y={cy + gateH / 2 + 9}
                      textAnchor="middle"
                      fontSize={7}
                      fontFamily="var(--font-mono)"
                      fill="var(--text-muted)"
                    >
                      {(gate.angle / Math.PI).toFixed(2)}pi
                    </text>
                  )}
                </g>
              )}
            </g>
          )
        })}

        {hoveredCell && selectedGate && !pendingConnection && (() => {
          const { qubit, step } = hoveredCell
          const key = `${qubit}-${step}`
          if (gateMap.has(key)) return null
          const def = GATES[selectedGate]
          if (!def) return null
          const cx = PAD_LEFT + QUBIT_LABEL_W + step * CELL_W + CELL_W / 2
          const cy = PAD_TOP + qubit * CELL_H + CELL_H / 2
          const gateW = def.label.length > 2 ? 36 : 30
          return (
            <g opacity={0.3} style={{ pointerEvents: "none" }}>
              <rect x={cx - gateW / 2} y={cy - 13} width={gateW} height={26} rx={6} fill={def.color} />
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fontSize={def.label.length > 2 ? 8 : 11}
                fontWeight={700}
                fontFamily="var(--font-mono)"
                fill="#ffffff"
              >
                {def.label}
              </text>
            </g>
          )
        })()}

        {dragState && hoveredCell && (() => {
          const { qubit, step } = hoveredCell
          const cx = PAD_LEFT + QUBIT_LABEL_W + step * CELL_W + CELL_W / 2
          const cy = PAD_TOP + qubit * CELL_H + CELL_H / 2
          return (
            <rect
              x={cx - CELL_W / 2 + 4}
              y={cy - CELL_H / 2 + 6}
              width={CELL_W - 8}
              height={CELL_H - 12}
              fill="rgba(99,178,159,0.08)"
              stroke="var(--accent-cyan)"
              strokeWidth={1}
              strokeDasharray="4,2"
              rx={8}
              style={{ pointerEvents: "none" }}
            />
          )
        })()}
      </svg>
    </div>
  )
}

const gridViewportStyle = {
  overflowX: "auto",
  overflowY: "visible",
  padding: "10px 12px 18px",
  flex: 1,
} satisfies CSSProperties
