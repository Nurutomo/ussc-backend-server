import { useEffect, useState } from 'react'
import { CONDITIONS, MODES } from '../constants'
import { ImageUtility } from '../services'

export default function MarkerRow({ data, onUpdate, onDelete, onMove, onSelect, onViewer }) {
  const [name, setName] = useState(data.name || '')
  useEffect(() => setName(data.name || ''), [data.name])

  const upload = async (event, field, width, quality) => {
    const file = event.target.files[0]
    if (file) onUpdate(data.id, { [field]: await ImageUtility.compress(file, width, quality) })
  }

  return <tr>
    <td><b>#{data.id}</b><input className="row-name" value={name} onChange={event => setName(event.target.value)} onBlur={() => onUpdate(data.id, { name: name.trim() || data.name })} /></td>
    <td><select value={data.marker_type || 'pju'} onChange={event => onUpdate(data.id, { marker_type: event.target.value })}>{MODES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></td>
    <td><div className="media-actions">{data.photo && <button className="image-preview-button" title="Preview foto" onClick={() => window.open(data.photo, '_blank')}><img className="list-thumbnail" src={data.photo} alt={data.name || 'Marker image'} /></button>}{data.photo_360 && <button className="btn btn-sm btn-info" onClick={() => onViewer(data.photo_360)}>360°</button>}{!data.photo && <span className="text-muted">-</span>}<label className="btn btn-sm btn-light">📷<input type="file" accept="image/*" hidden onChange={event => upload(event, 'photo', 4000, .4)} /></label><label className="btn btn-sm btn-light">🌐<input type="file" accept="image/*" hidden onChange={event => upload(event, 'photo_360', 8000, .8)} /></label></div></td>
    <td><select value={data.condition || 'Terang'} onChange={event => onUpdate(data.id, { condition: event.target.value })}>{CONDITIONS.map(value => <option key={value}>{value}</option>)}</select></td>
    <td><input className="lux-input" type="number" step=".1" value={data.lux ?? ''} onChange={event => onUpdate(data.id, { lux: event.target.value === '' ? null : Number(event.target.value) })} /></td>
    <td><input type="checkbox" checked={!!data.done} onChange={event => onUpdate(data.id, { done: event.target.checked ? 1 : 0 })} /></td>
    <td><button onClick={() => onSelect(data.id)}>Lihat</button><button onClick={() => onMove(data.id)}>Pindah</button><button className="danger" onClick={() => onDelete(data.id)}>Hapus</button></td>
  </tr>
}
