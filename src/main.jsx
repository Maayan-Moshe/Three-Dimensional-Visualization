import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GeometryProvider } from './contexts/GeometryContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GeometryProvider>
      <App />
    </GeometryProvider>
  </StrictMode>,
)
