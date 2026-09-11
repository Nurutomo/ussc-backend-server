import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'pannellum/build/pannellum.css'
import 'pannellum'
import 'mdb-react-ui-kit/dist/css/mdb.min.css'
import './styles.css'
import './mdb-overrides.css'
import { MODES } from './constants'
import { MarkerApi, SocketConnection } from './services'
import { distance, markerIcon } from './mapUtils'
import MarkerRow from './components/MarkerRow'
import MarkerEditor from './components/MarkerEditor'
import Panorama from './components/Panorama'
import MeasureTool from './components/MeasureTool'

function App() {
  const api = useMemo(() => new MarkerApi(), [])
  const connection = useMemo(() => new SocketConnection(), [])
  const mapElement = useRef(null)
  const mapRef = useRef(null)
  const markerLayer = useRef(null)
  const markersRef = useRef([])
  const [mapInstance, setMapInstance] = useState(null)
  const [markers, setMarkers] = useState([])
  const [mode, setMode] = useState(localStorage.getItem('activeMarkerType') || 'pju')
  const [name, setName] = useState('')
  const [currentPosition, setCurrentPosition] = useState(null)
  const [currentLux, setCurrentLux] = useState(null)
  const [autoCenter, setAutoCenter] = useState(localStorage.getItem('autoCenterGps') !== 'false')
  const [showLabels, setShowLabels] = useState(localStorage.getItem('distanceLabels') !== 'false')
  const [placement, setPlacement] = useState(null)
  const [measure, setMeasure] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const [viewerImage, setViewerImage] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [connected, setConnected] = useState(false)
  const visibleMarkers = markers.filter(marker => (marker.marker_type || 'pju') === mode)
  const selected = markers.find(marker => marker.id === selectedId)

  useEffect(() => { markersRef.current = markers }, [markers])

  const saveMarker = async (id, changes) => {
    try {
      const current = markersRef.current.find(marker => marker.id === id)
      const updated = await api.update(id, { ...current, ...changes })
      setMarkers(items => items.map(item => item.id === id ? updated : item))
      connection.emit('marker.update', updated)
    } catch (error) { setNotice(`Gagal memperbarui titik: ${error.message}`) }
  }

  const addMarker = async latlng => {
    try {
      const created = await api.create({ name: name.trim() || `${MODES.find(item => item.value === mode).label} ${new Date().toLocaleString()}`, latitude: latlng.lat, longitude: latlng.lng, date: new Date().toISOString(), condition: 'Terang', lux: currentLux, photo: '', photo_360: '', marker_type: mode })
      setMarkers(items => [...items, created]); connection.emit('marker.add', created); setName('')
    } catch (error) { setNotice(`Gagal menambah titik: ${error.message}`) }
  }

  const deleteMarker = async id => {
    try { await api.remove(id); setMarkers(items => items.filter(item => item.id !== id)); connection.emit('marker.remove', { id }); setSelectedId(null) }
    catch (error) { setNotice(`Gagal menghapus titik: ${error.message}`) }
  }

  useEffect(() => {
    const map = L.map(mapElement.current, { zoomControl: false, maxZoom: 24 }).setView([-7.2575, 112.7521], 15)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 24, attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    mapRef.current = map; markerLayer.current = L.layerGroup().addTo(map); setMapInstance(map)
    return () => map.remove()
  }, [])

  useEffect(() => {
    if (!mapRef.current) return undefined
    const handleMapClick = event => {
      if (placement?.kind === 'create') { addMarker(event.latlng); setPlacement(null) }
      if (placement?.kind === 'move') { saveMarker(placement.id, { latitude: event.latlng.lat, longitude: event.latlng.lng }); setPlacement(null) }
    }
    mapRef.current.on('click', handleMapClick)
    return () => mapRef.current?.off('click', handleMapClick)
  }, [placement, markers, name, mode, currentLux])

  useEffect(() => {
    api.list().then(setMarkers).catch(error => setNotice(`Gagal memuat data marker: ${error.message}`))
    const off = [connection.on('connect', () => setConnected(true)), connection.on('disconnect', () => setConnected(false)), connection.on('marker.add', data => setMarkers(items => items.some(item => item.id === data.id) ? items : [...items, data])), connection.on('marker.update', data => setMarkers(items => items.map(item => item.id === data.id ? data : item))), connection.on('marker.remove', data => setMarkers(items => items.filter(item => item.id !== data.id)))]
    return () => off.forEach(cleanup => cleanup())
  }, [api, connection])

  useEffect(() => {
    if (!mapRef.current || !markerLayer.current) return
    markerLayer.current.clearLayers()
    visibleMarkers.forEach(data => {
      const point = L.latLng(Number(data.latitude), Number(data.longitude))
      const popupImage = data.photo ? `<img class="map-popup-image" src="${data.photo}" alt="${data.name || 'Marker image'}">` : ''
      const marker = L.marker(point, { icon: markerIcon(data.condition, data.done) }).bindTooltip(distance(currentPosition, point), { permanent: showLabels, direction: 'top', className: 'distance-tooltip', offset: [0, -15] }).bindPopup(`<div class="map-popup"><strong>#${data.id}</strong><div class="map-popup-name">${data.name || ''}</div>${popupImage}<div>${Number(data.latitude).toFixed(6)}, ${Number(data.longitude).toFixed(6)}</div></div>`).addTo(markerLayer.current)
      marker.on('click', () => setSelectedId(data.id))
    })
  }, [markers, mode, showLabels, currentPosition, visibleMarkers])

  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.locate({ watch: true, enableHighAccuracy: true, setView: false })
    const found = event => { setCurrentPosition(event.latlng); if (autoCenter) mapRef.current.panTo(event.latlng); connection.emit('point.location', { lat: event.latlng.lat, lng: event.latlng.lng, id: connection.id, lux: currentLux, timestamp: Date.now() }) }
    const failed = () => setNotice('GPS tidak ditemukan. Tekan Mark Point lalu pilih lokasi di peta.')
    mapRef.current.on('locationfound', found).on('locationerror', failed)
    return () => mapRef.current?.off('locationfound', found).off('locationerror', failed)
  }, [autoCenter, connection, currentLux])

  useEffect(() => {
    if (!('AmbientLightSensor' in window)) return
    try { const sensor = new AmbientLightSensor({ frequency: 1 }); sensor.addEventListener('reading', () => setCurrentLux(sensor.illuminance)); sensor.start(); return () => sensor.stop() } catch { /* optional sensor */ }
  }, [])

  const mark = () => currentPosition ? addMarker(currentPosition) : setPlacement({ kind: 'create' })
  const importCsv = event => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { for (const line of String(reader.result).trim().split('\n').slice(1)) { const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); const latitude = Number(cols[2]); const longitude = Number(cols[3]); if (cols.length >= 4 && !Number.isNaN(latitude) && !Number.isNaN(longitude)) await addMarker({ lat: latitude, lng: longitude }) } event.target.value = '' }; reader.readAsText(file) }
  const exportCsv = () => { const header = 'ID,Name,Latitude,Longitude,Date,Condition,Lux,Done,Mode\n'; const rows = markers.map(item => `${item.id},"${(item.name || '').replaceAll('"', '""')}",${item.latitude},${item.longitude},${item.date || ''},${item.condition},${item.lux ?? ''},${item.done ? 1 : 0},${item.marker_type || 'pju'}`).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([header + rows], { type: 'text/csv' })); link.download = `markers_${Date.now()}.csv`; link.click(); URL.revokeObjectURL(link.href) }

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}><header className="sidebar-header"><div><h1>Peta Penerangan</h1><p>Live · React</p></div><span className={connected ? 'connected' : 'disconnected'}>{connected ? 'Terhubung' : 'Terputus'}</span></header><section className="legend"><b>Legenda</b><span><i className="dot dark" />Gelap</span><span><i className="dot dim" />Redup</span><span><i className="dot bright" />Terang</span></section><section className="list-panel"><h2>Daftar Titik Lokasi</h2><div className="table-wrap"><table><thead><tr><th>ID</th><th>Mode</th><th>Foto</th><th>Kondisi</th><th>Lux</th><th>Selesai</th><th>Aksi</th></tr></thead><tbody>{visibleMarkers.map(item => <MarkerRow key={item.id} data={item} onUpdate={saveMarker} onDelete={deleteMarker} onMove={id => setPlacement({ kind: 'move', id })} onSelect={setSelectedId} onViewer={setViewerImage} />)}</tbody></table></div></section></aside>
    <main className="map-area"><button className="sidebar-toggle" onClick={() => setSidebarOpen(value => !value)}>☰</button><button className="recenter" onClick={() => currentPosition && mapRef.current.flyTo(currentPosition, 18)}>⌖</button><div className="lux-badge">💡 {currentLux == null ? 'N/A' : Math.round(currentLux * 10) / 10} <small>lux</small></div><div ref={mapElement} className="map" /><MeasureTool map={mapInstance} active={measure && !placement} /><div className="controls-wrap"><div className="pill"><label>Mode</label><select value={mode} onChange={event => { setMode(event.target.value); localStorage.setItem('activeMarkerType', event.target.value) }}>{MODES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div className="pill"><label>Name</label><input value={name} onChange={event => setName(event.target.value)} placeholder="Marker name" /></div><div className="toggles"><label><input type="checkbox" checked={autoCenter} onChange={event => { setAutoCenter(event.target.checked); localStorage.setItem('autoCenterGps', event.target.checked) }} /> Auto-center</label><label><input type="checkbox" checked={showLabels} onChange={event => { setShowLabels(event.target.checked); localStorage.setItem('distanceLabels', event.target.checked) }} /> Labels</label></div><div className="actions"><button className="primary" onClick={mark}>Mark Point</button><button className={measure ? 'active' : ''} onClick={() => setMeasure(value => !value)}>📏 Ukur</button><button onClick={exportCsv}>Export</button><label className="file-button">Import<input type="file" accept=".csv" onChange={importCsv} /></label></div></div></main>
    {selected && <MarkerEditor data={selected} onUpdate={saveMarker} onDelete={deleteMarker} onMove={id => setPlacement({ kind: 'move', id })} onClose={() => setSelectedId(null)} onViewer={setViewerImage} />}{viewerImage && <Panorama image={viewerImage} onClose={() => setViewerImage(null)} />}{placement && <div className="placement-banner">{placement.kind === 'create' ? 'Klik peta untuk membuat marker' : 'Klik peta untuk memindahkan marker'} <button onClick={() => setPlacement(null)}>Batal</button></div>}{notice && <div className="notice" onClick={() => setNotice(null)}>{notice}</div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
