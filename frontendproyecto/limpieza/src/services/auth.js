import { request } from './http'

const SESSION_KEY = 'limpieza.sesion'

/**
 * Inicia sesión contra la API. El backend valida contra `administrador`
 * (email o usuario) y contra `clientes` (email).
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ id: number, nombre: string, email: string, rol: 'ADMIN' | 'CLIENTE', institucion?: string }>}
 */
export async function login(email, password) {
  const { data } = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  saveSession(data)
  return data
}

/**
 * Registra un cliente nuevo en la tabla `clientes`.
 *
 * @param {{ nombre: string, institucion: string, domicilio: string, nif: string, email: string, password: string }} form
 */
export async function registerUser(form) {
  const { data } = await request('/auth/register', {
    method: 'POST',
    body: form,
  })

  saveSession(data)
  return data
}

/**
 * Sesión guardada en el navegador. Solo contiene datos públicos del usuario:
 * la contraseña y su hash nunca salen del servidor. Las sesiones viejas
 * (formato anterior, con datos de demo) se descartan.
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const session = JSON.parse(raw)
    const isValid =
      session &&
      typeof session.nombre === 'string' &&
      typeof session.email === 'string' &&
      ['ADMIN', 'CLIENTE'].includes(session.rol)

    if (!isValid) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }

    return session
  } catch {
    return null
  }
}

export function saveSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } catch {
    // Sin almacenamiento la sesión vive solo en memoria.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Sin almacenamiento no hay nada que limpiar.
  }
}
