import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/shared/Sidebar'
import { TopBar } from './components/shared/TopBar'
import { Home } from './pages/Home'

// Lazy-load heavy pages so the home page doesn't pay for Three.js/D3/simulator code
const Simulator = lazy(() => import('./pages/Simulator').then(m => ({ default: m.Simulator })))
const Protocols = lazy(() => import('./pages/Protocols').then(m => ({ default: m.Protocols })))
const Algorithms = lazy(() => import('./pages/Algorithms').then(m => ({ default: m.Algorithms })))

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Suspense fallback={
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
              fontSize: 12,
            }}>
              Loading…
            </div>
          }>
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
