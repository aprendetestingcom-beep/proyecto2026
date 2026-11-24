import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import Home from './pages/Home'
import AdminHome from './pages/AdminHome'
import { getSession, saveSession, clearSession } from './services/auth'

function App() {
  const [user, setUser] = useState(getSession)
  const [authMode, setAuthMode] = useState(null)

  const handleAuthenticated = (authenticatedUser) => {
    saveSession(authenticatedUser)
    setUser(authenticatedUser)
    setAuthMode(null)
  }

  const handleLogout = () => {
    clearSession()
    setUser(null)
    setAuthMode(null)
  }

  // El administrador no ve la homepage: se lo deriva directamente a su pantalla.
  if (user?.rol === 'ADMIN') {
    return <AdminHome user={user} onLogout={handleLogout} />
  }

  return (
    <div className="app">
      <Navbar user={user} onOpenAuth={setAuthMode} onLogout={handleLogout} />
      <Home />

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={setAuthMode}
          onAuthenticated={handleAuthenticated}
        />
      )}
    </div>
  )
}

export default App
