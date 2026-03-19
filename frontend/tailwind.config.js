/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Quantum design system
        quantum: {
          bg:        '#050a14',
          surface:   '#0a1628',
          panel:     '#0f1f38',
          border:    '#1a3a5c',
          accent:    '#00d4ff',
          'accent-2':'#7c3aed',
          text:      '#e2f0ff',
          muted:     '#6b8cad',
        },
        // Gate colors
        gate: {
          h:     '#00d4ff',   // Hadamard  — cyan
          x:     '#f59e0b',   // Pauli-X   — amber
          y:     '#10b981',   // Pauli-Y   — emerald
          z:     '#8b5cf6',   // Pauli-Z   — violet
          cnot:  '#ef4444',   // CNOT      — red
          t:     '#f97316',   // T gate    — orange
          s:     '#06b6d4',   // S gate    — sky
          swap:  '#a855f7',   // SWAP      — purple
          rx:    '#84cc16',   // Rx        — lime
          ry:    '#ec4899',   // Ry        — pink
          rz:    '#14b8a6',   // Rz        — teal
          m:     '#6b7280',   // Measure   — gray
        },
        // Noise severity
        noise: {
          none:   '#10b981',
          low:    '#84cc16',
          medium: '#f59e0b',
          high:   '#ef4444',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow':  'spin 8s linear infinite',
        'qubit-idle': 'qubitIdle 4s ease-in-out infinite',
        'gate-drop':  'gateDrop 0.2s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
      },
      keyframes: {
        qubitIdle: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.05)' },
        },
        gateDrop: {
          '0%':   { transform: 'scale(1.2)', opacity: '0.5' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
