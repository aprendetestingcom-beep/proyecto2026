import { request } from './http'

/**
 * Servicios publicados en la tabla `servicios` (publicado = 1),
 * en el orden en que se cargaron.
 *
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function listarServiciosPublicados({ signal } = {}) {
  const { data } = await request('/servicios?publicado=1&orden=asc&limit=20', { signal })
  return data
}

/**
 * Todos los servicios, publicados o no, para el panel de administración.
 *
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function listarServicios({ signal } = {}) {
  const { data } = await request('/servicios?orden=asc&limit=200', { signal })
  return data
}

/**
 * Actualiza un servicio (PATCH parcial) y devuelve el registro actualizado.
 *
 * @param {number} id
 * @param {{ nombre?: string, caracteristicas?: string, publicado?: boolean }} cambios
 */
export async function actualizarServicio(id, cambios) {
  const { data } = await request(`/servicios/${id}`, { method: 'PATCH', body: cambios })
  return data
}
