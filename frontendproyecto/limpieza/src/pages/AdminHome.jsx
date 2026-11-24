import { useEffect, useState } from 'react'
import { Building2, ClipboardCheck, LogOut, Pencil, Sparkles, Users } from 'lucide-react'
import ServiceEditModal from '../components/ServiceEditModal'
import ServiceIcon from '../components/ServiceIcon'
import { obtenerResumen } from '../services/estadisticas'
import { listarServicios } from '../services/servicios'

const numberFormat = new Intl.NumberFormat('es-AR')

const CARDS = [
  { key: 'clientes', label: 'Instituciones clientes', icon: Building2 },
  { key: 'personal', label: 'Personal registrado', icon: Users },
  { key: 'tareasRealizadas', label: 'Tareas realizadas', icon: ClipboardCheck },
  { key: 'serviciosPublicados', label: 'Servicios publicados', icon: Sparkles },
]

export default function AdminHome({ user, onLogout }) {
  const [resumen, setResumen] = useState(null)
  const [error, setError] = useState('')
  const [servicios, setServicios] = useState(null)
  const [serviciosError, setServiciosError] = useState('')
  const [editing, setEditing] = useState(null)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    obtenerResumen({ signal: controller.signal })
      .then(setResumen)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })

    listarServicios({ signal: controller.signal })
      .then(setServicios)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setServiciosError(requestError.message)
      })

    return () => controller.abort()
  }, [])

  const handleSaved = (actualizado) => {
    setServicios((current) =>
      (current ?? []).map((servicio) =>
        servicio.id_tarea === actualizado.id_tarea ? actualizado : servicio,
      ),
    )
    setEditing(null)
    setSavedMessage(`“${actualizado.nombre}” se guardó correctamente.`)

    obtenerResumen()
      .then(setResumen)
      .catch(() => {})
  }

  return (
    <div className="admin-page">
      <button type="button" className="btn btn--ghost admin-page__logout" onClick={onLogout}>
        <LogOut className="icon" aria-hidden="true" />
        Cerrar sesión
      </button>

      <div className="admin-page__content">
        <p className="eyebrow">Panel de administración</p>
        <h1>Hola{user?.nombre ? `, ${user.nombre}` : ' Administrador'}</h1>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : (
          <div className="admin-stats">
            {CARDS.map(({ key, label, icon: CardIcon }) => (
              <article className="admin-stat" key={key}>
                <span className="admin-stat__icon">
                  <CardIcon className="icon" aria-hidden="true" />
                </span>
                <strong className="admin-stat__value">
                  {resumen ? numberFormat.format(resumen[key]) : '—'}
                </strong>
                <span className="admin-stat__label">{label}</span>
              </article>
            ))}
          </div>
        )}

        <section className="admin-services" aria-labelledby="admin-services-title">
          <header className="admin-services__header">
            <div>
              <h2 id="admin-services-title">Servicios</h2>
              <p>
                Editá la descripción ampliada que se muestra al hacer clic en cada tarjeta de
                la homepage.
              </p>
            </div>
            {savedMessage && (
              <p className="admin-services__saved" role="status">
                {savedMessage}
              </p>
            )}
          </header>

          {serviciosError ? (
            <p className="form-error" role="alert">
              {serviciosError}
            </p>
          ) : servicios === null ? (
            <p className="admin-services__state">Cargando servicios…</p>
          ) : (
            <ul className="admin-services__list">
              {servicios.map((servicio) => (
                <li className="admin-service" key={servicio.id_tarea}>
                  <span className="admin-service__icon">
                    <ServiceIcon name={servicio.icono} />
                  </span>

                  <div className="admin-service__info">
                    <strong>{servicio.nombre ?? `Servicio #${servicio.id_tarea}`}</strong>
                    <span>{servicio.descripcion}</span>
                  </div>

                  <span
                    className={`admin-service__badge ${
                      servicio.publicado ? 'is-public' : 'is-hidden'
                    }`}
                  >
                    {servicio.publicado ? 'Publicado' : 'Oculto'}
                  </span>

                  <button
                    type="button"
                    className="btn btn--ghost admin-service__edit"
                    onClick={() => {
                      setSavedMessage('')
                      setEditing(servicio)
                    }}
                  >
                    <Pencil className="icon" aria-hidden="true" />
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {editing && (
        <ServiceEditModal
          service={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
