import { useEffect, useRef } from "react"
import { useCircuitStore } from "@/store/circuitStore"

/**
 * Sync circuit to/from URL hash for bookmarkable circuits.
 * Format: #circuit={"cols":[["H",1],["•","X"]]}
 */
export function useUrlCircuit() {
  const { toJSON, fromJSON, gates, nQubits, initialStates } = useCircuitStore()
  const isInitialized = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  // Load circuit from URL on mount
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#circuit=')) {
      try {
        const json = decodeURIComponent(hash.slice('#circuit='.length))
        fromJSON(json)
      } catch {
        // Invalid hash, ignore
      }
    }
    isInitialized.current = true
  }, [])

  // Update URL on circuit changes (debounced)
  useEffect(() => {
    if (!isInitialized.current) return
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      if (gates.length === 0) {
        // Clear hash when circuit is empty
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname + window.location.search)
        }
        return
      }
      const json = toJSON()
      const newHash = `#circuit=${encodeURIComponent(json)}`
      if (window.location.hash !== newHash) {
        history.replaceState(null, '', newHash)
      }
    }, 300)

    return () => clearTimeout(debounceTimer.current)
  }, [gates, nQubits, JSON.stringify(initialStates)])

  // Listen for hash changes (back/forward navigation)
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash
      if (hash.startsWith('#circuit=')) {
        try {
          const json = decodeURIComponent(hash.slice('#circuit='.length))
          fromJSON(json)
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])
}
