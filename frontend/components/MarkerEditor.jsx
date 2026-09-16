import { useEffect, useState } from 'react'
import { CONDITIONS, MODES } from '../constants'
import { ImageUtility } from '../util/services'
import { MDBBtn, MDBCard, MDBCardBody, MDBCheckbox, MDBInput } from 'mdb-react-ui-kit'

export default function MarkerEditor({ data, onUpdate, onDelete, onMove, onLocate, onClose, onViewer }) {
  const [name, setName] = useState(data.name || '')
  useEffect(() => setName(data.name || ''), [data.id, data.name])
  const upload = async (event, field, width, quality) => {
    const file = event.target.files[0]
    if (file) onUpdate(data.id, { [field]: await ImageUtility.compress(file, width, quality) })
  }

  return (
    <MDBCard
      className="position-absolute top-0 end-0 m-3 animation fade-in"
      style={{ zIndex: 1300, width: '280px', background: 'linear-gradient(160deg, #ffffff, #e5f7ec)' }}
    >
      <MDBCardBody className="d-flex flex-column gap-2">
        <MDBBtn color="link" className="position-absolute top-0 end-0 p-2" onClick={onClose} aria-label="Tutup">
          ×
        </MDBBtn>
        <h2 className="h5">#{data.id}</h2>
        <MDBInput label="Nama" value={name} onChange={(event) => setName(event.target.value)} onBlur={() => onUpdate(data.id, { name })} />
        <label className="small text-muted">
          Mode
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
        </label>
        <label>
          Kondisi
          <select
            className="form-select form-select-sm"
            value={data.condition || 'Terang'}
            onChange={(event) => onUpdate(data.id, { condition: event.target.value })}
          >
            {CONDITIONS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Lux
          <MDBInput
            label="Lux"
            type="number"
            step=".1"
            value={data.lux ?? ''}
            onChange={(event) => onUpdate(data.id, { lux: event.target.value === '' ? null : Number(event.target.value) })}
          />
        </label>
        <MDBCheckbox label="Sudah ditinjau" checked={!!data.done} onChange={(event) => onUpdate(data.id, { done: event.target.checked ? 1 : 0 })} />
        <div className="d-flex flex-wrap gap-2">
          {data.photo && (
            <img
              src={data.photo}
              alt={data.name || 'Marker image'}
              style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
              onClick={() => onViewer(data.photo, 'photo')}
            />
          )}
          {data.photo_360 && (
            <MDBBtn color="info" size="sm" aria-label="Buka foto 360" title="Buka foto 360" onClick={() => onViewer(data.photo_360, '360')}>
              <i className="fas fa-globe" />
            </MDBBtn>
          )}
          <MDBBtn tag="label" color="light" size="sm">
            📷 Foto
            <input type="file" className="d-none" accept="image/*" onChange={(event) => upload(event, 'photo', 2000, 0.4)} />
          </MDBBtn>
          <MDBBtn tag="label" color="light" size="sm">
            🌐 360°
            <input type="file" className="d-none" accept="image/*" onChange={(event) => upload(event, 'photo_360', 4000, 0.5)} />
          </MDBBtn>
        </div>
        <MDBBtn color="secondary" aria-label="Pindahkan marker" title="Pindahkan marker" onClick={() => onMove(data.id)}>
          <i className="fas fa-arrows-up-down-left-right" />
        </MDBBtn>
        <MDBBtn color="info" aria-label="Menuju marker" title="Menuju marker" onClick={() => onLocate(data.id)}>
          <i className="fas fa-location-arrow" />
        </MDBBtn>
        <MDBBtn color="danger" aria-label="Hapus marker" title="Hapus marker" onClick={() => onDelete(data.id)}>
          <i className="fas fa-trash" />
        </MDBBtn>
      </MDBCardBody>
    </MDBCard>
  )
}
