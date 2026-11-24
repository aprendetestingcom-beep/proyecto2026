import { useEffect, useRef } from 'react'

/**
 * Comportamiento común de los modales: cierra con Escape y bloquea el scroll
 * del documento mientras está abierto.
 *
 * @param {() => void} onClose
 */
export function useModalBehavior(onClose) {
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeRef.current()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}
