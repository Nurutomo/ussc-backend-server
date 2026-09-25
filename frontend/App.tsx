import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MODES_FORMAT } from './constants'
import { MarkerApi, SocketConnection } from './util/services'
import { distance, markerIcon } from './util/format'
import MarkerEditor from './components/markers/MarkerEditor'
import Viewer from './components/viewer'
import MeasureTool from './components/map/MeasureTool'
import Sidebar from './components/markers/Sidebar'
import MapControls from './components/map/MapControls'
import MapFeedback from './components/map/MapFeedback'
import type { LocationPoint, Marker, MarkerChanges, ViewerImage } from '../types/Marker'

type Placement = { kind: 'create' } | { kind: 'move'; id: number }

export default function App() {
  const api = useMemo(() => new MarkerApi(), [])
  const connection = useMemo(() => new SocketConnection(), [])
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayer = useRef<L.LayerGroup | null>(null)
  const locationMarker = useRef<L.CircleMarker | null>(null)
  const otherLocationLayer = useRef<L.LayerGroup | null>(null)
  const markersRef = useRef<Marker[]>([])
  
  // NEW: Dictionary to track active marker instances for efficient re-rendering
  const markerInstances = useRef(new Map<number, L.Marker>())
  
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const [markers, setMarkers] = useState<Marker[]>([])
  const [mode, setMode] = useState(localStorage.getItem('activeMarkerType') || 'pju')
  const [currentPosition, setCurrentPosition] = useState<L.LatLngExpression | null>(null)
  const [currentLux, setCurrentLux] = useState<number | null>(null)
  const [otherLocations, setOtherLocations] = useState<Record<string, LocationPoint>>({})
  const [autoCenter, setAutoCenter] = useState(localStorage.getItem('autoCenterGps') !== 'false')
  const [showLabels, setShowLabels] = useState(localStorage.getItem('distanceLabels') === 'true')
  const [placement, setPlacement] = useState<Placement | null>(null)
  const [measure, setMeasure] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [notice, setNotice] = useState<string | null>(null)
  const [viewerImage, setViewerImage] = useState<ViewerImage>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [connected, setConnected] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  // Keep refs for closures to avoid re-binding click events
  const measureRef = useRef(measure)
  measureRef.current = measure
  const placementRef = useRef(placement)
  placementRef.current = placement

  const visibleMarkers = markers.filter((marker) => {
    if ((marker.marker_type || 'pju') !== mode) return false
    const query = searchTerm.trim().toLowerCase()
    if (!query) return true
    return [marker.id, marker.name, marker.condition, marker.latitude, marker.longitude]
      .filter((value) => value != null)
      .some((value) => String(value).toLowerCase().includes(query))
  })
  
  const selected = markers.find((marker) => marker.id === selectedId)
  const openViewer = (source: string | number, type: ViewerImage['type'] = 'photo') => setViewerImage(type === 'qr' ? { value: source, type } : { image: String(source), type })
  
  const goToMarker = (id: number) => {
    const marker = markersRef.current.find((item) => item.id === id)
    if (!marker || !mapRef.current) return
    mapRef.current.flyTo([Number(marker.latitude), Number(marker.longitude)], 18)
    setSelectedId(id)
  }

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(true)
    }
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    markersRef.current = markers
  }, [markers])

  const saveMarker = async (id: number, changes: MarkerChanges) => {
    try {
      const current = markersRef.current.find((marker) => marker.id === id)
      const updated = await api.update(id, { ...current, ...changes })
      setMarkers((items) => items.map((item) => (item.id === id ? updated : item)))
      connection.emit('marker.update', updated)
    } catch (error) {
      setNotice(`Gagal memperbarui titik: ${error.message}`)
    }
  }

  const addMarker = async (latlng: L.LatLngExpression) => {
    const point = L.latLng(latlng)
    try {
      const created = await api.create({
        name: `${MODES_FORMAT[mode]?.label} ${new Date().toLocaleString()}`,
        latitude: point.lat,
        longitude: point.lng,
        date: new Date().toISOString(),
        condition: 'Terang',
        lux: currentLux,
        photo: '',
        photo_360: '',
        marker_type: mode,
      })
      setMarkers((items) => [...items, created])
      connection.emit('marker.add', created)
    } catch (error) {
      setNotice(`Gagal menambah titik: ${error.message}`)
    }
  }

  const deleteMarker = async (id: number) => {
    try {
      await api.remove(id)
      setMarkers((items) => items.filter((item) => item.id !== id))
      connection.emit('marker.remove', { id })
      setSelectedId(null)
    } catch (error) {
      setNotice(`Gagal menghapus titik: ${error.message}`)
    }
  }

  useEffect(() => {
    const map = L.map(mapElement.current, { zoomControl: false, maxZoom: 24 }).setView([-7.301062, 112.670743], 17)
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      referrerPolicy: 'strict-origin-when-cross-origin',
      maxZoom: 24,
      maxNativeZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    mapRef.current = map
    markerLayer.current = L.layerGroup().addTo(map)
    otherLocationLayer.current = L.layerGroup().addTo(map)
    setMapInstance(map)
    return () => { map.remove() }
  }, [])

  useEffect(() => {
    const element = mapElement.current
    const map = mapRef.current
    if (!element || !map || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [mapInstance])

  useEffect(() => {
    if (!mapRef.current) return undefined
    const handleMapClick: L.LeafletMouseEventHandlerFn = (event) => {
      switch (placement?.kind) {
        case 'create':
          addMarker(event.latlng)
          setPlacement(null)
          break
        case 'move':
          saveMarker(placement.id, { latitude: event.latlng.lat, longitude: event.latlng.lng })
          setPlacement(null)
          break
        default:
          break
      }
    }
    mapRef.current.on('click', handleMapClick)
    return () => { mapRef.current?.off('click', handleMapClick) }
  }, [placement, markers, mode, currentLux])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const handleMapDrag = () => {
      setAutoCenter(false)
      localStorage.setItem('autoCenterGps', String(false))
    }
    map.on('dragstart', handleMapDrag)
    return () => { map.off('dragstart', handleMapDrag) }
  }, [mapInstance])

  useEffect(() => {
    api
      .list()
      .then(setMarkers)
      .catch((error) => setNotice(`Gagal memuat data marker: ${error.message}`))
    const off = [
      connection.on('connect', () => {
        setConnected(true)
        connection.emit('point.location.request')
      }),
      connection.on('disconnect', () => setConnected(false)),
      connection.on('point.location.snapshot', (locations) => {
        setOtherLocations(
          Object.fromEntries(
            locations
              .filter((data) => data?.id && data.id !== connection.id && data.lat != null && data.lng != null)
              .map((data) => [data.id, { lat: Number(data.lat), lng: Number(data.lng) }])
          )
        )
      }),
      connection.on('point.location', (data) => {
        if (!data?.id || data.id === connection.id || data.lat == null || data.lng == null) return
        setOtherLocations((locations) => ({ ...locations, [data.id]: { lat: Number(data.lat), lng: Number(data.lng) } }))
      }),
      connection.on('point.location.remove', (id) => {
        setOtherLocations((locations) => {
          const next = { ...locations }
          delete next[id]
          return next
        })
      }),
      connection.on('marker.add', (data) => setMarkers((items) => (items.some((item) => item.id === data.id) ? items : [...items, data]))),
      connection.on('marker.update', (data) => setMarkers((items) => items.map((item) => (item.id === data.id ? data : item)))),
      connection.on('marker.remove', (data) => setMarkers((items) => items.filter((item) => item.id !== data.id))),
    ]
    return () => off.forEach((cleanup) => cleanup())
  }, [api, connection])

  // OPTIMIZED MARKER RENDERING
  useEffect(() => {
    if (!mapRef.current || !markerLayer.current) return
    
    const layer = markerLayer.current
    const instances = markerInstances.current
    const visibleIds = new Set<number>()

    visibleMarkers.forEach((data) => {
      visibleIds.add(data.id)
      const point = L.latLng(Number(data.latitude), Number(data.longitude))
      const popupImage = data.photo ? `<img src="${data.photo}" alt="${data.name || 'Marker image'}" style="width:120px;height:80px;display:block;object-fit:cover;border-radius:6px;margin:0 auto 6px">` : ''
      const popupContent = `<div style="min-width:150px;text-align:center"><strong>#${data.id}</strong><div style="font-weight:600;margin:4px 0 6px">${data.name || ''}</div>${popupImage}<div>${Number(data.latitude).toFixed(6)}, ${Number(data.longitude).toFixed(6)}</div></div>`
      const tooltipContent = distance(currentPosition, point)

      let marker = instances.get(data.id)

      if (marker) {
        // Update existing marker (highly efficient)
        marker.setLatLng(point)
        marker.setIcon(markerIcon(data))
        marker.setPopupContent(popupContent)
        marker.unbindTooltip().bindTooltip(tooltipContent, { permanent: showLabels, direction: 'top', className: 'distance-tooltip', offset: [0, -15] })
      } else {
        // Create new marker
        marker = L.marker(point, { icon: markerIcon(data) })
          .bindTooltip(tooltipContent, { permanent: showLabels, direction: 'top', className: 'distance-tooltip', offset: [0, -15] })
          .bindPopup(popupContent)
          .addTo(layer)
        
        marker.on('click', () => {
          setSelectedId(data.id)
          // We use refs here to avoid locking stale variables in closure
          if (measureRef.current && !placementRef.current) mapRef.current?.fire('click', { latlng: point })
        })
        
        instances.set(data.id, marker)
      }
    })

    // Clean up markers that are no longer visible or were deleted
    for (const [id, marker] of instances.entries()) {
      if (!visibleIds.has(id)) {
        layer.removeLayer(marker)
        instances.delete(id)
      }
    }
  }, [visibleMarkers, showLabels, currentPosition]) // Removed measure and placement dependencies because they are handled by refs

  useEffect(() => {
    if (!mapRef.current || !currentPosition) return

    if (!locationMarker.current) {
      locationMarker.current = L.circleMarker(currentPosition, {
        radius: 8,
        color: '#fff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 1,
        bubblingMouseEvents: false,
      }).addTo(mapRef.current)
    } else {
      locationMarker.current.setLatLng(currentPosition)
    }
  }, [currentPosition, mapInstance])

  useEffect(() => {
    if (!otherLocationLayer.current) return

    otherLocationLayer.current.clearLayers()
    Object.entries(otherLocations).forEach(([id, location]) => {
      L.circleMarker([location.lat, location.lng], {
        radius: 8,
        color: '#fff',
        weight: 3,
        fillColor: '#9333ea',
        fillOpacity: 1,
        bubblingMouseEvents: false,
      })
        .bindTooltip(`Pengguna ${id.slice(0, 6)}`, { direction: 'top', offset: [0, -8] })
        .addTo(otherLocationLayer.current)
    })
  }, [otherLocations, mapInstance])

  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.locate({ watch: true, enableHighAccuracy: true, setView: false })
    const found = (event) => {
      setCurrentPosition(event.latlng)
      if (autoCenter) mapRef.current.panTo(event.latlng)
      connection.emit('point.location', { lat: event.latlng.lat, lng: event.latlng.lng, id: connection.id, lux: currentLux, timestamp: Date.now() })
    }
    const failed = () => setNotice('GPS tidak ditemukan. Tekan Mark Point lalu pilih lokasi di peta.')
    mapRef.current.on('locationfound', found).on('locationerror', failed)
    return () => { mapRef.current?.off('locationfound', found).off('locationerror', failed) }
  }, [autoCenter, connection, currentLux])

  useEffect(() => {
    if (!('AmbientLightSensor' in window)) return
    try {
      const sensor = new AmbientLightSensor({ frequency: 1 })
      sensor.addEventListener('reading', () => setCurrentLux(sensor.illuminance))
      sensor.start()
      return () => sensor.stop()
    } catch {
      /* optional sensor */
    }
  }, [])

  const mark = () => (currentPosition ? addMarker(currentPosition) : setPlacement({ kind: 'create' }))
  
  const recenter = () => {
    setAutoCenter(true)
    localStorage.setItem('autoCenterGps', String(true))
    if (currentPosition) mapRef.current?.flyTo(currentPosition, 18)
  }
  
  const importCsv = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      for (const line of String(reader.result).trim().split('\n').slice(1)) {
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        const latitude = Number(cols[2])
        const longitude = Number(cols[3])
        if (cols.length >= 4 && !Number.isNaN(latitude) && !Number.isNaN(longitude)) await addMarker({ lat: latitude, lng: longitude })
      }
      event.target.value = ''
    }
    reader.readAsText(file)
  }
  
  const exportCsv = () => {
    const header = 'ID,Name,Latitude,Longitude,Date,Condition,Lux,Done,Mode\n'
    const rows = markers
      .map(
        (item) =>
          `${item.id},"${(item.name || '').replaceAll('"', '""')}",${item.latitude},${item.longitude},${item.date || ''},${item.condition},${item.lux ?? ''},${item.done ? 1 : 0},${item.marker_type || 'pju'}`
      )
      .join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([header + rows], { type: 'text/csv' }))
    link.download = `markers_${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="d-flex vh-100 overflow-hidden animation fade-in">
      <Sidebar
        open={sidebarOpen}
        mobile={isMobile}
        connected={connected}
        markers={visibleMarkers}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onUpdate={saveMarker}
        onDelete={deleteMarker}
        onMove={(id) => setPlacement({ kind: 'move', id })}
        onLocate={goToMarker}
        onSelect={setSelectedId}
        onViewer={openViewer}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="position-relative flex-grow-1 animation fade-in" style={{ minWidth: 0 }}>
        <div ref={mapElement} className="position-absolute top-0 bottom-0 start-0 end-0" />
        <MeasureTool map={mapInstance} markers={markers} active={measure && !placement} />
        <MapControls
          mode={mode}
          setMode={setMode}
          autoCenter={autoCenter}
          setAutoCenter={setAutoCenter}
          showLabels={showLabels}
          setShowLabels={setShowLabels}
          currentLux={currentLux}
          currentPosition={currentPosition}
          mapRef={mapRef}
          onRecenter={recenter}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          measure={measure}
          setMeasure={setMeasure}
          mark={mark}
          exportCsv={exportCsv}
          importCsv={importCsv}
          isFullscreen={false}
          toggleFullscreen={() => undefined}
        />
      </main>
      {selected && (
        <MarkerEditor
          data={selected}
          onUpdate={saveMarker}
          onDelete={deleteMarker}
          onMove={(id) => setPlacement({ kind: 'move', id })}
          onLocate={goToMarker}
          onClose={() => setSelectedId(null)}
          onViewer={openViewer}
        />
      )}
      <Viewer viewerImage={viewerImage} setViewerImage={setViewerImage} />
      <MapFeedback placement={placement} setPlacement={setPlacement} notice={notice} setNotice={setNotice} />
    </div>
  )
}