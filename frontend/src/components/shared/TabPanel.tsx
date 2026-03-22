import { useEffect, useState } from "react"

export interface Tab { id: string; label: string; content: React.ReactNode }

export function TabPanel({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === active)) {
      setActive(tabs[0]?.id)
    }
  }, [active, tabs])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-panel)" }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          overflowX: "auto",
          background: "rgba(247, 242, 232, 0.7)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              style={{
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
                color: isActive ? "var(--accent-cyan)" : "var(--text-secondary)",
                background: isActive ? "rgba(45, 106, 90, 0.08)" : "transparent",
                border: `1px solid ${isActive ? "rgba(45, 106, 90, 0.25)" : "var(--border)"}`,
                borderRadius: 999,
                transition: "all var(--transition)",
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {tabs.find((tab) => tab.id === active)?.content}
      </div>
    </div>
  )
}
