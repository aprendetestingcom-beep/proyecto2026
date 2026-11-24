import { useState } from 'react'
import { X } from 'lucide-react'
import { actualizarServicio } from '../services/servicios'
import { useModalBehavior } from '../hooks/useModalBehavior'

const MAX_NOMBRE = 120
const MAX_CARACTERISTICAS = 5000

/**
 * Edición de un servicio desde el panel: nombre, descripción ampliada que ve el
 * cliente en el modal del sitio, y visibilidad en la homepage.
 */
export default function ServiceEditModal({ service, onClose, onSaved }) {
  useModalBehavior(onClose)

  const [nombre, setNombre] = useState(service.nombre ?? '')
  const [caracteristicas, setCaracteristicas] = useState(service.caracteristicas ?? '')
  const [publicado, setPublicado] = useState(Boolean(service.publicado))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const nombreLimpio = nombre.trim()
    if (nombreLimpio.length < 3) {
      setError('El nombre del servicio debe tener al menos 3 caracteres.')
      return
    }
    if (caracteristicas.length > MAX_CARACTERISTICAS) {
      setError(`Las características no pueden superar los ${MAX_CARACTERISTICAS} caracteres.`)
      return
    }

    setSaving(true)
    try {
      const actualizado = await actualizarServicio(service.id_tarea, {
        nombre: nombreLimpio,
        caracteristicas: caracteristicas.trim(),
        publicado,
      })
      onSaved(actualizado)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
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
        aria-labelledby="service-edit-title"
      >
        <button type="button" className="modal__close" aria-label="Cerrar" onClick={onClose}>
          <X aria-hidden="true" />
        </button>

        <div className="modal__header">
          <p className="eyebrow">Editar servicio</p>
          <h2 id="service-edit-title">{service.nombre ?? `Servicio #${service.id_tarea}`}</h2>
          <p>
            La descripción ampliada es la que se muestra al hacer clic en la tarjeta de la
            homepage.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="service-nombre">Nombre</label>
            <input
              id="service-nombre"
              name="nombre"
              type="text"
              maxLength={MAX_NOMBRE}
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="service-caracteristicas">Descripción ampliada</label>
            <textarea
              id="service-caracteristicas"
              name="caracteristicas"
              rows={9}
              maxLength={MAX_CARACTERISTICAS}
              placeholder={'Un párrafo de introducción.\n• Primera característica.\n• Segunda característica.'}
              value={caracteristicas}
              onChange={(event) => setCaracteristicas(event.target.value)}
            />
            <span className="field__hint">
              {caracteristicas.length} / {MAX_CARACTERISTICAS} caracteres · una línea por ítem
            </span>
          </div>

          <label className="field-check">
            <input
              type="checkbox"
              checked={publicado}
              onChange={(event) => setPublicado(event.target.checked)}
            />
            <span>Mostrar este servicio en la homepage</span>
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
