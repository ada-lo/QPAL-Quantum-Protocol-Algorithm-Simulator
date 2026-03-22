import { useCircuitStore } from "@/store/circuitStore"
import type { InitialStateId } from "@/lib/quantum/simulator"

export function InitialStateIndicator({ qubit }: { qubit: number }) {
  const { initialStates, cycleInitialState, setInitialState } = useCircuitStore()
  const state = initialStates[qubit] ?? '|0⟩'

  const stateColors: Record<InitialStateId, string> = {
    '|0⟩': 'var(--text-muted)',
    '|1⟩': '#EF5350',
    '|+⟩': '#4FC3F7',
    '|−⟩': '#4FC3F7',
    '|i⟩': '#66BB6A',
    '|−i⟩': '#66BB6A',
  }

  function handleClick() {
    cycleInitialState(qubit)
  }

  function handleMiddleClick(e: React.MouseEvent) {
    if (e.button === 1) {
      e.preventDefault()
      setInitialState(qubit, '|0⟩')
    }
  }

  return (
    <button
      onClick={handleClick}
      onMouseDown={handleMiddleClick}
      title={`Initial state: ${state}\nClick to cycle, middle-click to reset`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        width: '100%', height: '100%',
        fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
        color: stateColors[state] ?? 'var(--text-muted)',
        background: state !== '|0⟩' ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: state !== '|0⟩' ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        borderRadius: 3,
        cursor: 'pointer',
        padding: '0 4px',
        transition: 'all 0.15s ease',
      }}
    >
      {state}
    </button>
  )
}
