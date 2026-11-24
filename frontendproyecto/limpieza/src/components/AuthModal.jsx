import { useState } from 'react'
import { X } from 'lucide-react'
import { login, registerUser } from '../services/auth'
import { useModalBehavior } from '../hooks/useModalBehavior'

const emptyForm = {
  nombre: '',
  institucion: '',
  domicilio: '',
  nif: '',
  email: '',
  password: '',
}

const MIN_PASSWORD_LENGTH = 8

/**
 * Valida el formulario en el cliente antes de llamar a la API.
 * El backend vuelve a validar todo: esta capa es solo para dar feedback rápido.
 *
 * @param {'login' | 'register'} mode
 * @param {typeof emptyForm} form
 * @returns {string} mensaje de error, o '' si está todo bien
 */
function validate(mode, form) {
  if (!form.email.trim()) return 'Ingresá tu correo electrónico.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return 'El correo electrónico no tiene un formato válido.'
  }
  if (!form.password) return 'Ingresá tu contraseña.'

  if (mode === 'login') return ''

  if (form.nombre.trim().length < 3) return 'Ingresá tu nombre y apellido.'
  if (!form.institucion.trim()) return 'Ingresá el nombre de tu institución.'
  if (!form.domicilio.trim()) return 'Ingresá el domicilio de tu institución.'
  if (!form.nif.trim()) return 'Ingresá el CUIT/NIF de tu institución.'
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  return ''
}

export default function AuthModal({ mode, onClose, onSwitchMode, onAuthenticated }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useModalBehavior(onClose)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const switchMode = (nextMode) => {
    setError('')
    setForm(emptyForm)
    onSwitchMode(nextMode)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const validationError = validate(mode, form)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      const user =
        mode === 'login'
          ? await login(form.email.trim(), form.password)
          : await registerUser({
              nombre: form.nombre.trim(),
              institucion: form.institucion.trim(),
              domicilio: form.domicilio.trim(),
              nif: form.nif.trim(),
              email: form.email.trim(),
              password: form.password,
            })

      onAuthenticated(user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button type="button" className="modal__close" aria-label="Cerrar" onClick={onClose}>
          <X aria-hidden="true" />
        </button>

        <div className="modal__header">
          <p className="eyebrow">{mode === 'login' ? 'Acceso' : 'Nueva cuenta'}</p>
          <h2 id="auth-title">
            {mode === 'login' ? 'Ingresá a tu cuenta' : 'Registrate como cliente'}
          </h2>
          <p>
            {mode === 'login'
              ? 'Accedé para gestionar los servicios de tu institución.'
              : 'Creá tu cuenta para solicitar propuestas y seguir tus servicios.'}
          </p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => switchMode('login')}
          >
            Ingresar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => switchMode('register')}
          >
            Registrarse
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <>
              <div className="field">
                <label htmlFor="auth-name">Nombre y apellido</label>
                <input
                  id="auth-name"
                  name="nombre"
                  type="text"
                  autoComplete="name"
                  placeholder="Ej.: María Fernández"
                  value={form.nombre}
                  onChange={handleChange}
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="auth-company">Institución u organización</label>
                <input
                  id="auth-company"
                  name="institucion"
                  type="text"
                  autoComplete="organization"
                  placeholder="Ej.: Colegio San Martín"
                  value={form.institucion}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="auth-address">Domicilio</label>
                <input
                  id="auth-address"
                  name="domicilio"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Ej.: Av. Corrientes 1234, CABA"
                  value={form.domicilio}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="auth-nif">CUIT / NIF</label>
                <input
                  id="auth-nif"
                  name="nif"
                  type="text"
                  placeholder="Ej.: 30-71000001-1"
                  value={form.nif}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="auth-email">Correo electrónico</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@institucion.com"
              value={form.email}
              onChange={handleChange}
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="field">
            <label htmlFor="auth-password">Contraseña</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={
                mode === 'login' ? 'Tu contraseña' : `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`
              }
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting
              ? 'Enviando…'
              : mode === 'login'
                ? 'Ingresar'
                : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
