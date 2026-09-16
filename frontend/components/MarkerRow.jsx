import { useEffect, useState } from 'react'
import { CONDITIONS, MODES } from '../constants'
import { ImageUtility } from '../util/services'
import { MDBBtn, MDBCheckbox, MDBInput } from 'mdb-react-ui-kit'

export default function MarkerRow({ data, index, onUpdate, onDelete, onMove, onLocate, onSelect, onViewer }) {
  const [name, setName] = useState(data.name || '')
  const photo360Preview = data.photo_360?.endsWith('/config.json') ? data.photo_360.replace(/\/config\.json$/, '/fallback/f.jpg') : data.photo_360
  useEffect(() => setName(data.name || ''), [data.name])

  const upload = async (event, field, width, quality) => {
    const file = event.target.files[0]
    if (file) onUpdate(data.id, { [field]: await ImageUtility.compress(file, width, quality) })
  }

  return (
    <tr className="animation fade-in" style={{ animationDelay: `${index * 70}ms` }}>
      <td>
        <strong>#{data.id}</strong>
        <MDBInput
          size="sm"
          className="mt-1"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => onUpdate(data.id, { name: name.trim() || data.name })}
        />
      </td>
      <td>
        <select
          className="form-select form-select-sm"
          value={data.marker_type || 'pju'}
          onChange={(event) => onUpdate(data.id, { marker_type: event.target.value })}
        >
          {MODES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <div className="d-flex gap-1 align-items-center">
          {data.photo && (
            <MDBBtn tag="button" color="link" className="p-0" title="Preview foto" onClick={() => onViewer(data.photo, 'photo')}>
              <img
                src={data.photo}
                alt={data.name || 'Marker image'}
                style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px' }}
              />
            </MDBBtn>
          )}
          {data.photo_360 && (
            <MDBBtn tag="button" color="link" className="p-0" aria-label="Buka foto 360" title="Buka foto 360" onClick={() => onViewer(data.photo_360, '360')}>
              <img src={photo360Preview} alt="Pratinjau foto 360" style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px' }} />
            </MDBBtn>
          )}
          {!data.photo && <span className="text-muted">-</span>}
          <MDBBtn tag="label" color="light" size="sm">
            📷
            <input type="file" className="d-none" accept="image/*" onChange={(event) => upload(event, 'photo', 4000, 0.4)} />
          </MDBBtn>
          <MDBBtn tag="label" color="light" size="sm">
            🌐
            <input type="file" className="d-none" accept="image/*" onChange={(event) => upload(event, 'photo_360', 8000, 0.8)} />
          </MDBBtn>
          {data.photo && (
            <MDBBtn color="danger" size="sm" aria-label="Hapus foto biasa" title="Hapus foto biasa" onClick={() => onUpdate(data.id, { photo: '' })}>
              <i className="fas fa-trash" />
            </MDBBtn>
          )}
          {data.photo_360 && (
            <MDBBtn color="danger" size="sm" aria-label="Hapus foto 360" title="Hapus foto 360" onClick={() => onUpdate(data.id, { photo_360: '' })}>
              <i className="fas fa-trash" />
            </MDBBtn>
          )}
        </div>
      </td>
      <td>
        <select
          className="form-select form-select-sm"
          value={data.condition || 'Terang'}
          onChange={(event) => onUpdate(data.id, { condition: event.target.value })}
        >
          {CONDITIONS.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </td>
      <td>
        <MDBInput
          size="sm"
          style={{ width: '62px' }}
          type="number"
          step=".1"
          value={data.lux ?? ''}
          onChange={(event) => onUpdate(data.id, { lux: event.target.value === '' ? null : Number(event.target.value) })}
        />
      </td>
      <td>
        <MDBCheckbox checked={!!data.done} onChange={(event) => onUpdate(data.id, { done: event.target.checked ? 1 : 0 })} />
      </td>
      <td>
        <MDBBtn size="sm" color="primary" aria-label="Lihat marker" title="Lihat marker" onClick={() => onSelect(data.id)}>
          <i className="fas fa-eye" />
        </MDBBtn>
        <MDBBtn size="sm" color="info" aria-label="Menuju marker" title="Menuju marker" onClick={() => onLocate(data.id)}>
          <i className="fas fa-location-arrow" />
        </MDBBtn>
        <MDBBtn size="sm" color="secondary" aria-label="Pindahkan marker" title="Pindahkan marker" onClick={() => onMove(data.id)}>
          <i className="fas fa-arrows-up-down-left-right" />
        </MDBBtn>
        <MDBBtn size="sm" color="danger" aria-label="Hapus marker dan semua foto" title="Hapus marker dan semua foto" onClick={() => onDelete(data.id)}>
          <i className="fas fa-trash" />
        </MDBBtn>
      </td>
    </tr>
  )
}
