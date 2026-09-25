import { useEffect, useState } from 'react'
import { CONDITIONS, MODES_FORMAT } from '../../constants'
import { uploadEvent } from '../../util/services'
import { MDBBtnGroup, MDBBtn, MDBCard, MDBCardBody, MDBCheckbox, MDBDropdown, MDBDropdownMenu, MDBDropdownToggle, MDBDropdownItem, MDBInput } from 'mdb-react-ui-kit'

export default function MarkerEditor({ data, onUpdate, onDelete, onMove, onLocate, onClose, onViewer }) {
  const [name, setName] = useState(data.name || '')
  const [lux, setLux] = useState(data.lux || 0)
  const photo360Preview = data.photo_360?.endsWith('/config.json') ? data.photo_360.replace(/\/config\.json$/, '/fallback/f.jpg') : data.photo_360
  useEffect(() => setName(data.name || ''), [data.id, data.name])
  useEffect(() => setLux(data.lux || 0), [data.id, data.lux])

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
        <MDBDropdown>
          <MDBDropdownToggle color="light" size="sm" className="w-100 text-start">
            {MODES_FORMAT[(data.marker_type || 'pju')]?.label || 'PJU'}
          </MDBDropdownToggle>
          <MDBDropdownMenu>
            {Object.entries(MODES_FORMAT).map(([name, format]) => (
              <MDBDropdownItem
                key={name}
                link
                onClick={() => {
                  onUpdate(data.id, { marker_type: name })
                  localStorage.setItem('activeMarkerType', name)
                }}
              >
                {format.label}
              </MDBDropdownItem>
            ))}
          </MDBDropdownMenu>
        </MDBDropdown>
        <MDBDropdown>
          <MDBDropdownToggle color="light" size="sm" className="w-100 text-start">
            {data.condition || 'Terang'}
          </MDBDropdownToggle>
          <MDBDropdownMenu>
            {Object.values(CONDITIONS).map((value) => (
              <MDBDropdownItem
                key={value}
                link
                onClick={() => onUpdate(data.id, { condition: value })}
              >
                {value}
              </MDBDropdownItem>
            ))}
          </MDBDropdownMenu>
        </MDBDropdown>
        {MODES_FORMAT[data.marker_type]?.lux && (
          <MDBInput
            label="Lux"
            type="number"
            step=".1"
            value={lux ?? ''}
            onChange={(event) => setLux(Number(event.target.value))}
            onBlur={(event) => onUpdate(data.id, { lux: Number(event.target.value) })}
          />
        )}
        <MDBCheckbox label="Sudah ditinjau" checked={!!data.done} onChange={(event) => onUpdate(data.id, { done: event.target.checked ? 1 : 0 })} />
        <div className="d-flex flex-wrap gap-2">
          {data.photo && (
            <div className="d-flex align-items-start gap-1">
              <img
                src={data.photo}
                alt={data.name || 'Marker image'}
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => onViewer(data.photo, 'photo')}
              />
              <MDBBtn color="danger" size="sm" className="p-1" aria-label="Hapus foto biasa" title="Hapus foto biasa" onClick={() => onUpdate(data.id, { photo: '' })}>
                <i className="fas fa-trash" />
              </MDBBtn>
            </div>
          )}
          {data.photo_360 && (
            <div className="d-flex align-items-start gap-1">
              <img
                src={photo360Preview}
                alt="Pratinjau foto 360"
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => onViewer(data.photo_360, '360')}
              />
              <MDBBtn color="danger" size="sm" className="p-1" aria-label="Hapus foto 360" title="Hapus foto 360" onClick={() => onUpdate(data.id, { photo_360: '' })}>
                <i className="fas fa-trash" />
              </MDBBtn>
            </div>
          )}
          <MDBBtn tag="label" color="light" size="sm">
            📷 Foto
            <input type="file" className="d-none" accept="image/*" onChange={(event) => uploadEvent(event, 'photo', data.id, onUpdate)} />
          </MDBBtn>
          <MDBBtn tag="label" color="light" size="sm">
            🌐 360°
            <input type="file" className="d-none" accept="image/*" onChange={(event) => uploadEvent(event, 'photo_360', data.id, onUpdate)} />
          </MDBBtn>
        </div>
        <MDBBtnGroup className="w-100">
          <MDBBtn color="secondary" aria-label="Pindahkan marker" title="Pindahkan marker" onClick={() => onMove(data.id)}>
            <i className="fas fa-arrows-up-down-left-right" />
          </MDBBtn>
          <MDBBtn color="info" aria-label="Menuju marker" title="Menuju marker" onClick={() => onLocate(data.id)}>
            <i className="fas fa-location-arrow" />
          </MDBBtn>
          <MDBBtn color="danger" aria-label="Hapus marker dan semua foto" title="Hapus marker dan semua foto" onClick={() => onDelete(data.id)}>
            <i className="fas fa-trash" />
          </MDBBtn>
          <MDBBtn color="success" aria-label="Lihat QR Code" title="Lihat QR Code" onClick={() => onViewer(data.id, 'qr')}>
            <i className="fas fa-qrcode" />
          </MDBBtn>
        </MDBBtnGroup>
      </MDBCardBody>
    </MDBCard>
  )
}
