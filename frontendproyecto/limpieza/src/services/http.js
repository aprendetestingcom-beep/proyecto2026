const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '')

/**
 * Error con el mensaje que devuelve la API ({ error: { message } }).
 */
export class ApiError extends Error {
  constructor(message, status = 0, details = undefined) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/**
 * Cliente HTTP único de la aplicación. Centraliza la URL base, el JSON y los errores
 * para que los componentes no hablen con `fetch` directamente.
 *
 * @param {string} path ruta relativa a la base, ej. '/servicios'
 * @param {{ method?: string, body?: unknown, signal?: AbortSignal }} [options]
 */
export async function request(path, { method = 'GET', body, signal } = {}) {
  let response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError(
      'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.',
    )
  }

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message ?? 'Ocurrió un error inesperado. Intentá de nuevo.',
      response.status,
      payload?.error?.details,
    )
  }

  return payload
}
