import { useEffect, useRef } from 'react'
import L from 'leaflet'

function formatDistance(value) {
  return value < 1000 ? `${value.toFixed(1)}m` : `${(value / 1000).toFixed(2)}km`
}

export default function MeasureTool({ map, markers, active }) {
  const points = useRef([])
  const layer = useRef(null)
  const line = useRef(null)
  const labels = useRef([])

  // Add Label
  useEffect(() => {
    if (!map) return undefined
    layer.current = L.layerGroup().addTo(map)
    return () => {
      layer.current?.clearLayers()
      if (line.current) map.removeLayer(line.current)
      labels.current.forEach((label) => map.removeLayer(label))
    }
  }, [map])

  // Add Point
  useEffect(() => {
    if (!map || !layer.current) return undefined
    const click = (event) => {
      if (!active) return
      points.current.push(event.latlng)
      L.circleMarker(event.latlng, { radius: 6, color: '#fff', weight: 2, fillColor: '#f97316', fillOpacity: 1 }).addTo(layer.current)
      if (line.current) map.removeLayer(line.current)
      labels.current.forEach((label) => map.removeLayer(label))
      labels.current = []
      if (points.current.length < 2) return
      line.current = L.polyline(points.current, { color: '#f97316', weight: 3, dashArray: '6 6' }).addTo(map)
      for (let index = 1; index < points.current.length; index += 1) {
        const start = points.current[index - 1]
        const end = points.current[index]
        const distance = start.distanceTo(end)
        const midpoint = L.latLng((start.lat + end.lat) / 2, (start.lng + end.lng) / 2)
        labels.current.push(
          L.tooltip({ permanent: true, direction: 'center', className: 'measure-tooltip' })
            .setLatLng(midpoint)
            .setContent(formatDistance(distance))
            .addTo(map)
        )
      }
    }
    map.on('click', click)
    return () => map.off('click', click)
  }, [map, active])

  //
  useEffect(() => {
    if (active) return
    points.current = []
    layer.current?.clearLayers()
    if (line.current && map) map.removeLayer(line.current)
    line.current = null
    labels.current.forEach((label) => map?.removeLayer(label))
    labels.current = []
  }, [active, map])

  return null
}
