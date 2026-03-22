import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import { Sidebar } from "./components/shared/Sidebar"
import { TopBar } from "./components/shared/TopBar"
import { Home } from "./pages/Home"

const Simulator = lazy(() => import("./pages/Simulator").then((m) => ({ default: m.Simulator })))
const Protocols = lazy(() => import("./pages/Protocols").then((m) => ({ default: m.Protocols })))
const Algorithms = lazy(() => import("./pages/Algorithms").then((m) => ({ default: m.Algorithms })))

export default function App() {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        height: "100vh",
        padding: 16,
        overflow: "hidden",
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid rgba(216, 205, 185, 0.9)",
          borderRadius: "var(--radius-xl)",
          background: "rgba(251, 248, 241, 0.84)",
          boxShadow: "var(--shadow-soft)",
          backdropFilter: "blur(14px)",
        }}
      >
        <TopBar />
        <main style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Suspense
            fallback={
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  height: "100%",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                Loading workspace...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/simulator" element={<Simulator />} />
              <Route path="/protocols" element={<Protocols />} />
              <Route path="/algorithms" element={<Algorithms />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
