import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/shared/Sidebar'
import { TopBar } from './components/shared/TopBar'
import { Home } from './pages/Home'
import { Simulator } from './pages/Simulator'
import { Protocols } from './pages/Protocols'
import { Algorithms } from './pages/Algorithms'

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/protocols" element={<Protocols />} />
            <Route path="/algorithms" element={<Algorithms />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
