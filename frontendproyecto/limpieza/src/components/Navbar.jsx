import { useState } from 'react'
import { LogOut, Menu, Sparkles, X } from 'lucide-react'

const links = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#contacto', label: 'Contacto' },
]

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function Navbar({ user, onOpenAuth, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const openAuth = (mode) => {
    closeMenu()
    onOpenAuth(mode)
  }

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <a className="brand" href="#inicio" onClick={closeMenu}>
          <Sparkles className="brand__logo" aria-hidden="true" />
          <span className="brand__text">
            <span className="brand__name">Limpieza Institucional</span>
            <span className="brand__tagline">Higiene profesional</span>
          </span>
        </a>

        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <div id="navbar-menu" className={`navbar__menu ${menuOpen ? 'is-open' : ''}`}>
          <nav className="nav-links" aria-label="Secciones del sitio">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            {user ? (
              <>
                <div className="nav-user">
                  <span className="nav-user__avatar" aria-hidden="true">
                    {getInitials(user.nombre)}
                  </span>
                  <span className="nav-user__text">
                    <span className="nav-user__hello">Hola,</span>
                    <strong className="nav-user__name">{user.nombre}</strong>
                  </span>
                </div>
                <button type="button" className="btn btn--link" onClick={onLogout}>
                  <LogOut className="icon" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => openAuth('login')}
                >
                  Ingresar
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => openAuth('register')}
                >
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
