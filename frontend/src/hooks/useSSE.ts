import { useEffect, useRef, useCallback } from "react"

export interface SSEOptions<T> {
  url: string
  enabled: boolean
  onMessage: (data: T) => void
  onDone?: () => void
  onError?: (e: Event) => void
}

export function useSSE<T>({ url, enabled, onMessage, onDone, onError }: SSEOptions<T>) {
  const esRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (esRef.current) { esRef.current.close() }
    const es = new EventSource(url)
    esRef.current = es
    es.onmessage = (e) => {
      if (e.data === "[DONE]") { onDone?.(); es.close(); return }
      try { onMessage(JSON.parse(e.data) as T) } catch {}
    }
    es.onerror = (e) => { onError?.(e); es.close() }
  }, [url, onMessage, onDone, onError])

  useEffect(() => {
    if (enabled) connect()
    return () => esRef.current?.close()
  }, [enabled, connect])

  return { close: () => esRef.current?.close() }
}
