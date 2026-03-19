import { useState } from "react"

export interface Tab { id: string; label: string; content: React.ReactNode }

export function TabPanel({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            padding: "8px 16px", fontSize: 13, fontWeight: 500,
            color: active === t.id ? "var(--accent-cyan)" : "var(--text-secondary)",
            borderBottom: active === t.id ? "2px solid var(--accent-cyan)" : "2px solid transparent",
            transition: "color var(--transition)",
          }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {tabs.find(t => t.id === active)?.content}
      </div>
    </div>
  )
}
