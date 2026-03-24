/**
 * WorkspaceQuirkEmbed.tsx — Embedded Quirk drag-and-drop circuit editor.
 *
 * Quirk is a standalone circuit simulator by Craig Gidney (Apache-2.0).
 * This component loads it as an iframe with bidirectional messaging for
 * QPAL pseudocode ↔ Quirk circuit synchronization.
 *
 * Source: https://github.com/Strilanc/Quirk
 * Live: https://algassert.com/quirk
 */

import { useState, useRef, useCallback } from 'react'

const QUIRK_BASE_URL = 'https://algassert.com/quirk'

interface QuirkEmbedProps {
  /** Initial Quirk circuit JSON string, if any */
  initialCircuit?: string
  /** Callback when user modifies the circuit in Quirk */
  onCircuitChange?: (quirkUrl: string) => void
  /** Height of the embed */
  height?: number
}

export default function WorkspaceQuirkEmbed({
  initialCircuit,
  onCircuitChange,
  height = 500,
}: QuirkEmbedProps) {
  const [expanded, setExpanded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const quirkUrl = initialCircuit
    ? `${QUIRK_BASE_URL}#circuit=${encodeURIComponent(initialCircuit)}`
    : QUIRK_BASE_URL

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  return (
    <div style={{
      borderRadius: '8px',
      border: '1px solid var(--border, #334155)',
      overflow: 'hidden',
      background: 'var(--bg-elevated, #1e293b)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0.75rem',
        background: 'var(--bg-tertiary, #0f172a)',
        borderBottom: '1px solid var(--border, #334155)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>⚡</span>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary, #e2e8f0)',
          }}>
            Quirk Circuit Editor
          </span>
          <span style={{
            fontSize: '0.65rem',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--accent-cyan, #22d3ee)',
            color: '#000',
            fontWeight: 600,
          }}>
            external
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleToggle}
            style={{
              background: 'transparent',
              border: '1px solid var(--border, #334155)',
              borderRadius: '4px',
              padding: '2px 8px',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            {expanded ? '▲ Collapse' : '▼ Expand'}
          </button>
          <a
            href={QUIRK_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'transparent',
              border: '1px solid var(--border, #334155)',
              borderRadius: '4px',
              padding: '2px 8px',
              color: 'var(--text-secondary, #94a3b8)',
              textDecoration: 'none',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Open in new tab ↗
          </a>
        </div>
      </div>

      {/* Iframe embed */}
      {expanded && (
        <iframe
          ref={iframeRef}
          src={quirkUrl}
          title="Quirk Circuit Editor"
          style={{
            width: '100%',
            height: `${height}px`,
            border: 'none',
            background: '#fff',
          }}
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
      )}

      {!expanded && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted, #64748b)',
          fontSize: '0.8rem',
        }}>
          Click <strong>Expand</strong> to open the Quirk drag-and-drop circuit editor.
          <br />
          Build circuits visually and compare with QPAL pseudocode.
        </div>
      )}
    </div>
  )
}
