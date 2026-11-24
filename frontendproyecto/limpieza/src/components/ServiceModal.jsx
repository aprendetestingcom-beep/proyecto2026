import { X } from 'lucide-react'
import ServiceIcon from './ServiceIcon'
import { useModalBehavior } from '../hooks/useModalBehavior'

/**
 * Detalle público de un servicio: descripción ampliada (`caracteristicas`) e
 * insumos. El contenido se administra desde el panel de administración.
 */
export default function ServiceModal({ service, onClose, onRequestProposal }) {
  useModalBehavior(onClose)

  const insumos = (service.productos_utilizar ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
      >
        <button type="button" className="modal__close" aria-label="Cerrar" onClick={onClose}>
          <X aria-hidden="true" />
        </button>

        <div className="service-modal__header">
          <span className="service-card__icon service-modal__icon">
            <ServiceIcon name={service.icono} />
          </span>
          <div>
            <p className="eyebrow">Servicio</p>
            <h2 id="service-modal-title">{service.nombre}</h2>
          </div>
        </div>

        <p className="service-modal__summary">{service.descripcion}</p>

        <section className="service-modal__section" aria-labelledby="service-modal-features">
          <h3 id="service-modal-features">Características</h3>
          {service.caracteristicas ? (
            <p className="service-modal__features">{service.caracteristicas}</p>
          ) : (
            <p className="service-modal__features service-modal__features--empty">
              Todavía no se cargaron las características de este servicio.
            </p>
          )}
        </section>

        {insumos.length > 0 && (
          <section className="service-modal__section" aria-labelledby="service-modal-supplies">
            <h3 id="service-modal-supplies">Insumos principales</h3>
            <ul className="service-modal__tags">
              {insumos.map((insumo) => (
                <li key={insumo}>{insumo}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="service-modal__actions">
          <button type="button" className="btn btn--primary btn--lg" onClick={onRequestProposal}>
            Solicitar propuesta
          </button>
          <button type="button" className="btn btn--ghost-dark" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
