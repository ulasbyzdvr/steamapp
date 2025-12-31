import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('🚀 Main.jsx loaded!')
console.log('React:', StrictMode)
console.log('App:', App)

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('✅ App rendered!')
} else {
  console.error('❌ Root element not found!')
}
