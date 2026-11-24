import { request } from './http'

/**
 * Totales reales calculados por la API (clientes, personal, tareas y servicios).
 *
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function obtenerResumen({ signal } = {}) {
  const { data } = await request('/estadisticas', { signal })
  return data
}
