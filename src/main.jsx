import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { UserSessionProvider } from './UserSessionContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserSessionProvider>
      <App />
    </UserSessionProvider>
  </StrictMode>,
)
