import { useEffect, useState } from 'react'
import { CONDITIONS, MODES } from '../constants'
import { ImageUtility } from '../services'

export default function MarkerEditor({ data, onUpdate, onDelete, onMove, onClose, onViewer }) {
  const [name, setName] = useState(data.name || '')
  useEffect(() => setName(data.name || ''), [data.id, data.name])
  const upload = async (event, field, width, quality) => {
    const file = event.target.files[0]
    if (file) onUpdate(data.id, { [field]: await ImageUtility.compress(file, width, quality) })
  }

  return <div className="editor">
    <button className="editor-close" onClick={onClose}>×</button>
    <h2>#{data.id}</h2>
    <input value={name} onChange={event => setName(event.target.value)} onBlur={() => onUpdate(data.id, { name })} />
    <label>Mode<select value={data.marker_type || 'pju'} onChange={event => onUpdate(data.id, { marker_type: event.target.value })}>{MODES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <label>Kondisi<select value={data.condition || 'Terang'} onChange={event => onUpdate(data.id, { condition: event.target.value })}>{CONDITIONS.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Lux<input type="number" step=".1" value={data.lux ?? ''} onChange={event => onUpdate(data.id, { lux: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    <label><input type="checkbox" checked={!!data.done} onChange={event => onUpdate(data.id, { done: event.target.checked ? 1 : 0 })} /> Sudah ditinjau</label>
    <div className="editor-media">{data.photo && <img className="editor-preview-image" src={data.photo} alt={data.name || 'Marker image'} onClick={() => window.open(data.photo, '_blank')} />}{data.photo_360 && <button className="btn btn-info" onClick={() => onViewer(data.photo_360)}>Buka 360°</button>}<label className="btn btn-light">📷 Foto<input type="file" hidden accept="image/*" onChange={event => upload(event, 'photo', 2000, .4)} /></label><label className="btn btn-light">🌐 360°<input type="file" hidden accept="image/*" onChange={event => upload(event, 'photo_360', 4000, .5)} /></label></div>
    <button onClick={() => onMove(data.id)}>Pindah posisi</button>
    <button className="danger wide" onClick={() => onDelete(data.id)}>Hapus titik</button>
  </div>
}
