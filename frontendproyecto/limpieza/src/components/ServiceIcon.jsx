import {
  BedDouble,
  Building2,
  HeartPulse,
  Layers,
  Package,
  Sparkles,
  Trash2,
} from 'lucide-react'

// Traduce la clave guardada en `servicios`.`icono` a un ícono de lucide-react.
const ICONS = {
  building: Building2,
  sparkles: Sparkles,
  health: HeartPulse,
  layers: Layers,
  trash: Trash2,
  package: Package,
  bed: BedDouble,
}

export default function ServiceIcon({ name, className = 'icon' }) {
  const Icon = ICONS[name] ?? Sparkles
  return <Icon className={className} aria-hidden="true" />
}
