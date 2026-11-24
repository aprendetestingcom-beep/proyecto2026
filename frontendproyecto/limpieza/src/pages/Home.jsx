import { useEffect, useState } from 'react'
import { Check, Clock, Mail, MapPin, Phone, Sparkles } from 'lucide-react'
import ServiceIcon from '../components/ServiceIcon'
import ServiceModal from '../components/ServiceModal'
import { listarServiciosPublicados } from '../services/servicios'
import { obtenerResumen } from '../services/estadisticas'

// Los textos comerciales son estáticos; los datos (servicios y totales) vienen de la API.
const features = [
  'Personal capacitado y asegurado',
  'Supervisión permanente en cada turno',
  'Protocolos de bioseguridad',
  'Insumos de bajo impacto ambiental',
  'Reportes mensuales de gestión',
  'Atención de urgencias 24/7',
]

const steps = [
  {
    number: '01',
    title: 'Relevamiento',
    text: 'Visitamos las instalaciones y definimos junto al equipo las necesidades de cada sector.',
  },
  {
    number: '02',
    title: 'Propuesta',
    text: 'Presentamos un plan de trabajo con frecuencias, dotación y costos claros.',
  },
  {
    number: '03',
    title: 'Implementación',
    text: 'Coordinamos turnos y supervisiones para que el servicio no afecte la rutina diaria.',
  },
  {
    number: '04',
    title: 'Control de calidad',
    text: 'Medimos resultados con reportes periódicos y encuestas de satisfacción.',
  },
]

const CONTACT = {
  phone: '+54 11 4000-0000',
  phoneHref: 'tel:+541140000000',
  email: 'contacto@limpiezainstitucional.com.ar',
  address: 'Av. Corrientes 1234, CABA',
  hours: 'Lunes a viernes de 8 a 18 h · Guardias 24/7',
}

const CURRENT_YEAR = new Date().getFullYear()

const numberFormat = new Intl.NumberFormat('es-AR')

export default function Home() {
  const [servicios, setServicios] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [serviciosError, setServiciosError] = useState('')
  const [resumenError, setResumenError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listarServiciosPublicados({ signal: controller.signal })
      .then(setServicios)
      .catch((error) => {
        if (error.name !== 'AbortError') setServiciosError(error.message)
      })

    obtenerResumen({ signal: controller.signal })
      .then(setResumen)
      .catch((error) => {
        if (error.name !== 'AbortError') setResumenError(error.message)
      })

    return () => controller.abort()
  }, [reloadKey])

  const retryDatos = () => {
    setServicios(null)
    setResumen(null)
    setServiciosError('')
    setResumenError('')
    setReloadKey((key) => key + 1)
  }

  const stats = [
    { value: resumen ? numberFormat.format(resumen.clientes) : '—', label: 'instituciones atendidas' },
    { value: resumen ? numberFormat.format(resumen.personal) : '—', label: 'colaboradores en equipo' },
    { value: resumen ? numberFormat.format(resumen.tareasRealizadas) : '—', label: 'tareas realizadas' },
    { value: resumen ? numberFormat.format(resumen.serviciosPublicados) : '—', label: 'servicios disponibles' },
  ]

  return (
    <>
      <main>
        <section id="inicio" className="hero">
          <div className="container hero__inner">
            <div className="hero__content">
              <p className="hero__eyebrow">Servicio de limpieza institucional</p>
              <h1>Espacios impecables para instituciones que no pueden detenerse.</h1>
              <p className="hero__text">
                Diseñamos operativos de higiene a medida para oficinas, colegios, centros de
                salud y organismos públicos. Personal capacitado, supervisión permanente y
                protocolos claros.
              </p>
              <div className="hero__actions">
                <a className="btn btn--light btn--lg" href="#contacto">
                  Solicitar una propuesta
                </a>
                <a className="btn btn--outline-light btn--lg" href="#servicios">
                  Conocer servicios
                </a>
              </div>
              <ul className="hero__trust">
                <li>Personal asegurado</li>
                <li>Insumos habilitados</li>
                <li>Supervisión permanente</li>
              </ul>
            </div>

            <aside className="hero__panel" aria-label="Nuestro servicio en números">
              <p className="hero__panel-title">Nuestro servicio en números</p>
              <dl className="hero__stats">
                {stats.map((stat) => (
                  <div className="stat" key={stat.label}>
                    <dt className="stat__value">{stat.value}</dt>
                    <dd className="stat__label">{stat.label}</dd>
                  </div>
                ))}
              </dl>
              <p className="hero__panel-note">
                {resumenError || 'Cobertura en CABA y Gran Buenos Aires.'}
              </p>
            </aside>
          </div>
        </section>

        <section id="servicios" className="section">
          <div className="container">
            <header className="section-heading">
              <p className="eyebrow">Servicios</p>
              <h2>Soluciones integrales de higiene</h2>
              <p>
                Un solo proveedor para todas las necesidades de limpieza de tu institución,
                con estándares verificables y equipos estables.
              </p>
            </header>

            {serviciosError ? (
              <div className="services-state" role="alert">
                <p>{serviciosError}</p>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={retryDatos}
                >
                  Reintentar
                </button>
              </div>
            ) : servicios === null ? (
              <p className="services-state">Cargando servicios…</p>
            ) : servicios.length === 0 ? (
              <p className="services-state">Todavía no hay servicios publicados.</p>
            ) : (
              <div className="services-grid">
                {servicios.map((service) => (
                  <article className="service-card" key={service.id_tarea}>
                    <span className="service-card__icon">
                      <ServiceIcon name={service.icono} />
                    </span>
                    <h3>{service.nombre}</h3>
                    <p>{service.descripcion}</p>
                    <span className="service-card__more" aria-hidden="true">
                      Ver características
                    </span>
                    <button
                      type="button"
                      className="service-card__hit"
                      aria-label={`Ver características de ${service.nombre}`}
                      onClick={() => setSelectedService(service)}
                    />
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="nosotros" className="section section--surface">
          <div className="container about">
            <div className="about__content">
              <p className="eyebrow">Quiénes somos</p>
              <h2>Un equipo pensado para el ritmo de tu institución</h2>
              <p>
                Desde 2010 acompañamos a organizaciones que necesitan mantener sus espacios
                en condiciones óptimas sin alterar su funcionamiento diario. Trabajamos con
                equipos fijos, capacitación continua y una coordinación cercana.
              </p>
              <p>
                Cada institución recibe un plan de trabajo propio, con frecuencias, sectores
                y responsables definidos desde el primer día.
              </p>

              <ul className="about__features">
                {features.map((feature) => (
                  <li key={feature}>
                    <Check className="about__check" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="about__panel">
              <div className="about__badge">
                <span>15</span>
                <small>años de trayectoria</small>
              </div>
              <h3>Programa de calidad continua</h3>
              <p>
                Auditamos cada operativo con listas de control por sector y compartimos los
                resultados con el responsable de la institución.
              </p>
              <ul className="about__tags">
                <li>Buenas prácticas ISO 9001</li>
                <li>Gestión ambiental ISO 14001</li>
                <li>Personal con ART</li>
              </ul>
            </aside>
          </div>
        </section>

        <section id="proceso" className="section section--tight">
          <div className="container">
            <header className="section-heading section-heading--center">
              <p className="eyebrow">Cómo trabajamos</p>
              <h2>Un proceso claro, de principio a fin</h2>
            </header>

            <ol className="steps">
              {steps.map((step) => (
                <li className="step" key={step.number}>
                  <span className="step__number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="contacto" className="section">
          <div className="container">
            <div className="contact-panel">
              <div>
                <p className="eyebrow eyebrow--light">Hablemos</p>
                <h2>¿Querés una propuesta para tu institución?</h2>
                <p>
                  Contanos qué espacios necesitás mantener y coordinamos una visita de
                  relevamiento sin cargo.
                </p>
                <div className="contact-panel__actions">
                  <a className="btn btn--light btn--lg" href={`mailto:${CONTACT.email}`}>
                    Solicitar propuesta
                  </a>
                  <a className="btn btn--outline-light btn--lg" href={CONTACT.phoneHref}>
                    Llamar ahora
                  </a>
                </div>
              </div>

              <ul className="contact-list">
                <li>
                  <span className="contact-list__icon">
                    <Phone className="icon" aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Teléfono</strong>
                    <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
                  </div>
                </li>
                <li>
                  <span className="contact-list__icon">
                    <Mail className="icon" aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Correo</strong>
                    <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                  </div>
                </li>
                <li>
                  <span className="contact-list__icon">
                    <MapPin className="icon" aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Oficina</strong>
                    <span className="contact-list__value">{CONTACT.address}</span>
                  </div>
                </li>
                <li>
                  <span className="contact-list__icon">
                    <Clock className="icon" aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Horarios</strong>
                    <span className="contact-list__value">{CONTACT.hours}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer__grid">
          <div className="footer__brand">
            <a className="brand brand--footer" href="#inicio">
              <Sparkles className="brand__logo" aria-hidden="true" />
              <span className="brand__text">
                <span className="brand__name">Limpieza Institucional</span>
                <span className="brand__tagline">Higiene profesional</span>
              </span>
            </a>
            <p>
              Servicios de limpieza y mantenimiento para instituciones, empresas y
              organizaciones de Buenos Aires.
            </p>
          </div>

          <div>
            <h3>Secciones</h3>
            <ul className="footer__links">
              <li>
                <a href="#inicio">Inicio</a>
              </li>
              <li>
                <a href="#servicios">Servicios</a>
              </li>
              <li>
                <a href="#nosotros">Nosotros</a>
              </li>
              <li>
                <a href="#contacto">Contacto</a>
              </li>
            </ul>
          </div>

          <div>
            <h3>Contacto</h3>
            <ul className="footer__contact">
              <li>
                <Phone className="icon" aria-hidden="true" />
                <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
              </li>
              <li>
                <Mail className="icon" aria-hidden="true" />
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
              <li>
                <MapPin className="icon" aria-hidden="true" />
                <span>{CONTACT.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="container footer__bottom">
          <span>© {CURRENT_YEAR} Limpieza Institucional. Todos los derechos reservados.</span>
          <span>Buenos Aires, Argentina</span>
        </div>
      </footer>

      {selectedService && (
        <ServiceModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onRequestProposal={() => {
            setSelectedService(null)
            window.location.hash = '#contacto'
          }}
        />
      )}
    </>
  )
}
