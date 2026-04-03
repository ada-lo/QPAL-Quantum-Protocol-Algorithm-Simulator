import React from 'react'
import ReactDOM from 'react-dom/client'
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react/ui"
import "@neondatabase/neon-js/ui/css"

import App from './App'
import { authClient } from "./lib/auth/authClient"
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NeonAuthUIProvider authClient={authClient} redirectTo="/workspace">
      <App />
    </NeonAuthUIProvider>
  </React.StrictMode>
)
