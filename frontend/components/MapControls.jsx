import {
  MDBBadge,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCheckbox,
  MDBDropdown,
  MDBDropdownItem,
  MDBDropdownMenu,
  MDBDropdownToggle,
} from 'mdb-react-ui-kit'
import { MODES } from '../constants'

export default function MapControls({
  mode,
  setMode,
  autoCenter,
  setAutoCenter,
  showLabels,
  setShowLabels,
  currentLux,
  currentPosition,
  mapRef,
  sidebarOpen,
  setSidebarOpen,
  measure,
  setMeasure,
  mark,
  exportCsv,
  importCsv,
}) {
  const persist = (key, value, setter) => {
    setter(value)
    localStorage.setItem(key, value)
  }

  return (
    <>
      <MDBBtn
        color="success"
        className="position-absolute top-0 start-0 m-3 animation fade-in p-2"
        style={{ zIndex: 1000, transition: 'transform .2s ease, box-shadow .2s ease' }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Tampilkan sidebar"
        title="Tampilkan sidebar"
        size="sm"
      >
        <i className="fas fa-bars" />
      </MDBBtn>
      <MDBBtn
        color="success"
        className="position-absolute top-0 end-0 m-3 animation fade-in p-2"
        style={{ zIndex: 1000, transition: 'transform .2s ease, box-shadow .2s ease' }}
        onClick={() => currentPosition && mapRef.current.flyTo(currentPosition, 18)}
        aria-label="Kembali ke lokasi"
        title="Kembali ke lokasi"
        size="sm"
      >
        <i className="fas fa-location-crosshairs" />
      </MDBBtn>
      <MDBBadge
        color="light"
        className="position-absolute top-0 start-50 translate-middle-x mt-3 px-3 py-2 text-dark shadow-sm animation fade-in"
        style={{ zIndex: 1000 }}
      >
        <i className="fas fa-lightbulb text-warning me-1" />
        {currentLux == null ? 'N/A' : Math.round(currentLux * 10) / 10} <small>lux</small>
      </MDBBadge>
      <div className="position-absolute top-0 start-50 translate-middle-x mt-5 pt-2 animation fade-in" style={{ zIndex: 1000 }}>
        <MDBDropdown>
          <MDBDropdownToggle color="success" size="sm" aria-label="Pilih mode marker" title="Pilih mode marker">
            {MODES.find((item) => item.value === mode)?.label || mode}
          </MDBDropdownToggle>
          <MDBDropdownMenu>
            {MODES.map((item) => (
              <MDBDropdownItem
                key={item.value}
                link
                onClick={() => {
                  setMode(item.value)
                  localStorage.setItem('activeMarkerType', item.value)
                }}
              >
                {item.label}
              </MDBDropdownItem>
            ))}
          </MDBDropdownMenu>
        </MDBDropdown>
      </div>
      <MDBCard
        className="map-controls position-absolute bottom-0 start-50 translate-middle-x animation fade-in"
        style={{ zIndex: 1000 }}
      >
        <MDBCardBody className="p-2 d-flex flex-wrap gap-2 align-items-center justify-content-center">
          <MDBCheckbox
            id="auto-center"
            label="GPS"
            checked={autoCenter}
            onChange={(event) => persist('autoCenterGps', event.target.checked, setAutoCenter)}
          />
          <MDBCheckbox
            id="show-labels"
            label="Label"
            checked={showLabels}
            onChange={(event) => persist('distanceLabels', event.target.checked, setShowLabels)}
          />
          <MDBBtn color="primary" size="sm" onClick={mark}>
            <i className="fas fa-location-dot me-1" />
            <span className="button-label">Mark</span>
          </MDBBtn>
          <MDBBtn color={measure ? 'warning' : 'warning'} size="sm" onClick={() => setMeasure(!measure)}>
            <i className="fas fa-ruler me-1" />
            <span className="button-label">Ukur</span>
          </MDBBtn>
          <MDBBtn color="secondary" size="sm" disabled>
            <i className="fas fa-rotate-left me-1" />
            <span className="button-label">Undo</span>
          </MDBBtn>
          <MDBBtn color="success" size="sm" onClick={exportCsv}>
            <i className="fas fa-file-export me-1" />
            <span className="button-label">Export</span>
          </MDBBtn>
          <MDBBtn tag="label" color="secondary" size="sm">
            <i className="fas fa-file-import me-1" />
            <span className="button-label">Import</span>
            <input type="file" className="d-none" accept=".csv" onChange={importCsv} />
          </MDBBtn>
        </MDBCardBody>
      </MDBCard>
    </>
  )
}
