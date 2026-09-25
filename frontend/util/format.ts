import L from 'leaflet'
import { COLORS } from '../constants'

export function getColorByLux(lux) {
  const minLux = 0
  const maxLux = 500
  const startHue = 0 // Red
  const endHue = 120 // Green
  const normalizedLux = Math.max(0, Math.min(maxLux, lux))
  const normalizedValue = Math.max(0, Math.log10(normalizedLux - minLux) / Math.log10(maxLux - minLux))
  const hue = startHue + (endHue - startHue) * normalizedValue
  const lightness = 45 + (normalizedValue * 20) // Adjust lightness based on lux
  return [`hsl(${hue}, 100%, ${lightness}%)`, `hsl(${hue}, 100%, ${lightness - 20}%)`] // Return fill and border colors
}

export function markerIcon({ condition, done, lux, marker_type }) {
  const [fill, border] = marker_type === 'pju_luar' ? getColorByLux(lux) : COLORS[condition] || COLORS.Terang
  const check = done
    ? '<circle cx="18" cy="6" r="5" fill="#16a34a" stroke="#fff"/><path d="M15.7 6l1.4 1.4L20.3 4" stroke="#fff" fill="none" stroke-linecap="round"/>'
    : ''
  const html = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${fill}" stroke="${border}" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#fff" opacity=".8"/>${check}</svg>`
  return L.divIcon({ html, className: '', iconSize: [28, 28], iconAnchor: [14, 14] })
}

export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString()
}

export function distance(origin, point) {
  if (!origin) return '-'
  const value = origin.distanceTo(point)
  return value < 1000 ? `${value.toFixed(1)}m` : `${(value / 1000).toFixed(2)}km`
}
