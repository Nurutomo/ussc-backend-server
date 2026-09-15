import L from 'leaflet'
import { COLORS } from '../constants'

export function markerIcon(condition, done) {
  const [fill, border] = COLORS[condition] || COLORS.Terang
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
