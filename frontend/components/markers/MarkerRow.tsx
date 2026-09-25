import { useEffect, useState } from 'react'
import { CONDITIONS, MODES_FORMAT } from '../../constants'
import { ImageUtility, uploadEvent } from '../../util/services'
import { MDBBtn, MDBCheckbox, MDBInput } from 'mdb-react-ui-kit'

export default function MarkerRow({ data, index, onUpdate, onDelete, onMove, onLocate, onSelect, onViewer }) {
  const [name, setName] = useState(data.name || '')
  const [lux, setLux] = useState(data.lux ?? 0)
  const photo360Preview = data.photo_360?.endsWith('/config.json') ? data.photo_360.replace(/\/config\.json$/, '/fallback/f.jpg') : data.photo_360
  useEffect(() => setName(data.name || ''), [data.id, data.name])
  useEffect(() => setLux(data.lux ?? 0), [data.lux])

  return (
    <tr className="animation fade-in" style={{ animationDelay: `${index * 70}ms` }}>
      <td>
        <MDBCheckbox checked={!!data.done} onChange={(event) => onUpdate(data.id, { done: event.target.checked ? 1 : 0 })} />
      </td>
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
        <div className="d-flex gap-1 align-items-center">
          {!data.photo && <span className="text-muted">-</span>}
          {data.photo && (
            <MDBBtn tag="button" color="link" className="p-0" title="Preview foto" onClick={() => onViewer(data.photo, 'photo')}>
              <img
                src={data.photo}
                alt={data.name || 'Marker image'}
                style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px' }}
              />
            </MDBBtn>
          )}
          {data.photo && (
            <MDBBtn
              className="p-2"
              tag="button"
              color="danger"
              size="sm"
              aria-label="Hapus foto biasa"
              title="Hapus foto biasa"
              onClick={() => onUpdate(data.id, { photo: '' })}
            >
              <i className="fas fa-trash" />
            </MDBBtn>
          )}
          <MDBBtn className="p-2" tag="label" color="light" size="sm">
            📷
            <input type="file" className="d-none" accept="image/*" onChange={(event) => uploadEvent(event, 'photo', data.id, onUpdate)} />
          </MDBBtn>
          {data.photo_360 && (
            <MDBBtn
              tag="button"
              color="link"
              className="p-0"
              aria-label="Buka foto 360"
              title="Buka foto 360"
              onClick={() => onViewer(data.photo_360, '360')}
            >
              <img
                src={photo360Preview}
                alt="Pratinjau foto 360"
                style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px' }}
              />
            </MDBBtn>
          )}
          {data.photo_360 && (
            <MDBBtn
              className="p-2"
              tag="button"
              color="danger"
              size="sm"
              aria-label="Hapus foto 360"
              title="Hapus foto 360"
              onClick={() => onUpdate(data.id, { photo_360: '' })}
            >
              <i className="fas fa-trash" />
            </MDBBtn>
          )}
          <MDBBtn className="p-2" tag="label" color="light" size="sm">
            🌐
            <input type="file" className="d-none" accept="image/*" onChange={(event) => uploadEvent(event, 'photo_360', data.id, onUpdate)} />
          </MDBBtn>
        </div>
      </td>
      <td>
        <select
          className="form-select form-select-sm"
          value={data.condition || 'Terang'}
          onChange={(event) => onUpdate(data.id, { condition: event.target.value })}
        >
          {Object.values(CONDITIONS).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </td>
      {MODES_FORMAT[data.marker_type]?.lux && (
        <td>
          <MDBInput
            size="sm"
            style={{ width: '15rem' }}
            type="number"
            step=".1"
            min={0}
            max={200000}
            placeholder="Lux"
            value={lux ?? ''}
            onChange={(event) => setLux(Number(event.target.value))}
            onBlur={(event) => onUpdate(data.id, { lux: Number(event.target.value) })}
          />
        </td>
      )}
      <td>
        <MDBBtn className="p-2" size="sm" color="primary" aria-label="Lihat marker" title="Lihat marker" onClick={() => onSelect(data.id)}>
          <i className="fas fa-eye" />
        </MDBBtn>
        <MDBBtn className="p-2" size="sm" color="info" aria-label="Menuju marker" title="Menuju marker" onClick={() => onLocate(data.id)}>
          <i className="fas fa-location-arrow" />
        </MDBBtn>
        <MDBBtn className="p-2" size="sm" color="secondary" aria-label="Pindahkan marker" title="Pindahkan marker" onClick={() => onMove(data.id)}>
          <i className="fas fa-arrows-up-down-left-right" />
        </MDBBtn>
        <MDBBtn
          className="p-2"
          size="sm"
          color="danger"
          aria-label="Hapus marker dan semua foto"
          title="Hapus marker dan semua foto"
          onClick={() => onDelete(data.id)}
        >
          <i className="fas fa-trash" />
        </MDBBtn>
        <MDBBtn className="p-2" size="sm" color="success" aria-label="Lihat QR Code" title="Lihat QR Code" onClick={() => onViewer(data.id, 'qr')}>
          <i className="fas fa-qrcode" />
        </MDBBtn>
      </td>
    </tr>
  )
}
