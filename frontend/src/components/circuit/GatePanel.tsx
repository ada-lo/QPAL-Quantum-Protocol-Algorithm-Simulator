import { useCircuitStore } from "@/store/circuitStore"
import { GATES, TOP_TOOLBOX, BOTTOM_TOOLBOX, type GateId } from "@/lib/quantum/gates"

interface ToolboxRowProps {
  groups: { label: string; ids: GateId[] }[]
  position: 'top' | 'bottom'
}

function ToolboxRow({ groups, position }: ToolboxRowProps) {
  const { selectedGate, setSelectedGate, setDragState, pendingConnection } = useCircuitStore()

  function handleDragStart(e: React.DragEvent, gateId: GateId) {
    e.dataTransfer.setData('application/gate-id', gateId)
    e.dataTransfer.effectAllowed = 'copyMove'
    setDragState({ gateId, source: 'toolbox' })
    // Create drag image
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    e.dataTransfer.setDragImage(el, rect.width / 2, rect.height / 2)
  }

  function handleDragEnd() {
    setDragState(null)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '5px 14px',
      borderTop: position === 'bottom' ? '1px solid var(--border)' : 'none',
      borderBottom: position === 'top' ? '1px solid var(--border)' : 'none',
      background: 'var(--bg-panel)', flexShrink: 0, flexWrap: 'wrap',
      minHeight: 42,
    }}>
      {groups.map(group => (
        <div key={group.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {group.label}
          </span>
          {group.ids.map(id => {
            const g = GATES[id]
            const active = selectedGate === id
            return (
              <button
                key={id}
                title={g.description}
                draggable
                onDragStart={(e) => handleDragStart(e, id)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedGate(active ? null : id)}
                style={{
                  width: g.label.length > 2 ? 42 : 34,
                  height: 28,
                  borderRadius: 4,
                  fontSize: g.label.length > 2 ? 9 : 11,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: active ? g.color : 'var(--bg-card)',
                  color: active ? '#fff' : g.color,
                  border: `1px solid ${active ? g.color : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.15s ease',
                  boxShadow: active ? `0 0 10px ${g.color}55` : 'none',
                  cursor: 'grab',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {g.label}
              </button>
            )
          })}
        </div>
      ))}

      {/* Active hint */}
      {selectedGate && (
        <div style={{
          marginLeft: 'auto', fontSize: 11,
          color: GATES[selectedGate]?.color ?? 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {pendingConnection
            ? `Click target qubit at step ${pendingConnection.step}`
            : `Click wire to place ${selectedGate}`}
          <button onClick={() => setSelectedGate(null)} style={{
            fontSize: 11, color: 'var(--text-muted)',
            border: 'none', cursor: 'pointer', background: 'none',
            padding: '0 4px',
          }}>✕</button>
        </div>
      )}
    </div>
  )
}

export function GatePanel() {
  return <ToolboxRow groups={TOP_TOOLBOX} position="top" />
}

export function GatePanelBottom() {
  return <ToolboxRow groups={BOTTOM_TOOLBOX} position="bottom" />
}
