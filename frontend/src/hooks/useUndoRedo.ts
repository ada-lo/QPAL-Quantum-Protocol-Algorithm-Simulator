import { useEffect } from "react"
import { useCircuitStore } from "@/store/circuitStore"

/**
 * Keyboard shortcuts for undo/redo.
 * - Ctrl+Z: Undo
 * - Ctrl+Y or Ctrl+Shift+Z: Redo
 */
export function useUndoRedo() {
  const { undo, redo } = useCircuitStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault()
          redo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])
}
