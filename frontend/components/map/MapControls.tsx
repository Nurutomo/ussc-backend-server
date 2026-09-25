import {
  MDBBtnGroup,
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
import { MODES_FORMAT } from '../../constants'

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
  onRecenter,
  sidebarOpen,
  setSidebarOpen,
  measure,
  setMeasure,
  mark,
  exportCsv,
  importCsv,
  isFullscreen,
  toggleFullscreen,
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
      <div className="position-absolute d-flex bottom-0 end-0 flex-column m-2 animation fade-in" style={{ zIndex: 1000 }}>
        <MDBBtn
          floating
          rounded
          color="dark"
          className="bottom-0 end-0 m-1 animation fade-in"
          style={{ transition: 'transform .2s ease, box-shadow .2s ease' }}
          size="lg"
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
          title="Fullscreen"
        >
          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
        </MDBBtn>
        <MDBBtn
          floating
          rounded
          color="info"
          className="bottom-0 end-0 m-1 animation fade-in"
          style={{ transition: 'transform .2s ease, box-shadow .2s ease' }}
          size="lg"
          disabled
          aria-label="Undo"
          title="Undo"
        >
          <i className="fas fa-rotate-left" />
        </MDBBtn>
        <MDBBtn
          floating
          rounded
          color="primary"
          className="bottom-0 end-0 m-1 animation fade-in"
          style={{ transition: 'transform .2s ease, box-shadow .2s ease' }}
          onClick={mark}
          size="lg"
          aria-label="Mark lokasi"
          title="Mark lokasi"
        >
          <i className="fas fa-location-dot" />
        </MDBBtn>
        <MDBBtn
          floating
          rounded
          color="warning"
          className="bottom-0 end-0 m-1 animation fade-in"
          style={{ transition: 'transform .2s ease, box-shadow .2s ease' }}
          size="lg"
          onClick={() => setMeasure(!measure)}
          aria-label="Ukur jarak"
          title="Ukur jarak"
        >
          <i className="fas fa-ruler" />
        </MDBBtn>
        <MDBBtn
          floating
          rounded
          color="success"
          className="bottom-0 end-0 m-1 animation fade-in"
          style={{ transition: 'transform .2s ease, box-shadow .2s ease' }}
          onClick={onRecenter}
          aria-label="Kembali ke lokasi"
          title="Kembali ke lokasi"
          size="lg"
        >
          <i className="fas fa-location-crosshairs" />
        </MDBBtn>
      </div>
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
            {MODES_FORMAT[mode]?.label || mode}
          </MDBDropdownToggle>
          <MDBDropdownMenu>
            {Object.entries(MODES_FORMAT).map(([value, { label }]) => (
              <MDBDropdownItem
                key={value}
                link
                onClick={() => {
                  setMode(value)
                  localStorage.setItem('activeMarkerType', value)
                }}
              >
                {label}
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
            id="show-labels"
            label="Label"
            checked={showLabels}
            onChange={(event) => persist('distanceLabels', event.target.checked, setShowLabels)}
          />
          <MDBBtnGroup>
            <MDBBtn color="success" onClick={exportCsv} className="p-2">
              <i className="fas fa-file-export me-1" />
              <span className="button-label">Export</span>
            </MDBBtn>
            <MDBBtn tag="label" color="secondary" className="p-2">
              <i className="fas fa-file-import me-1" />
              <span className="button-label">Import</span>
              <input type="file" className="d-none" accept=".csv" onChange={importCsv} />
            </MDBBtn>
          </MDBBtnGroup>
        </MDBCardBody>
      </MDBCard>
    </>
  )
}
