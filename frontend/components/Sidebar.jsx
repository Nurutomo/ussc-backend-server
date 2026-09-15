import { MDBBadge, MDBBtn, MDBTable, MDBTableBody, MDBTableHead } from 'mdb-react-ui-kit'
import MarkerRow from './MarkerRow'

export default function Sidebar({ open, mobile, connected, markers, onUpdate, onDelete, onMove, onSelect, onViewer, onClose }) {
  return (
    <aside
      className="bg-white shadow animation fade-in"
      style={{
        width: mobile ? 'min(390px, 92vw)' : open ? '340px' : 0,
        minWidth: mobile ? undefined : open ? '340px' : 0,
        height: '100%',
        flexDirection: 'column',
        zIndex: 1200,
        display: 'flex',
        position: mobile ? 'fixed' : 'relative',
        top: mobile ? 0 : undefined,
        bottom: mobile ? 0 : undefined,
        left: mobile ? 0 : undefined,
        transform: mobile && !open ? 'translateX(-105%)' : 'translateX(0)',
        transition: 'width .55s ease-in-out, min-width .55s ease-in-out, transform .55s ease-in-out',
        pointerEvents: open ? 'auto' : 'none',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <header
        className="text-dark p-3 d-flex justify-content-between align-items-center"
        style={{ background: 'linear-gradient(135deg, #7bc995 45%, #14a44d 100%)' }}
      >
        <div>
          <h1 className="h5 mb-1">Peta Penerangan</h1>
          <small>Live · React</small>
        </div>
        <MDBBtn color="dark" size="sm" className="ms-2" onClick={onClose} aria-label="Sembunyikan sidebar" title="Sembunyikan sidebar">
          <i className="fas fa-chevron-left" />
        </MDBBtn>
        <MDBBadge color={connected ? 'success' : 'danger'}>{connected ? 'Terhubung' : 'Terputus'}</MDBBadge>
      </header>
      <section className="p-3 border-bottom d-flex flex-wrap gap-2 small">
        <strong className="w-100 text-uppercase text-muted">Legenda</strong>
        <span>
          <i className="fas fa-circle text-danger me-1" />
          Gelap
        </span>
        <span>
          <i className="fas fa-circle text-warning me-1" />
          Redup
        </span>
        <span>
          <i className="fas fa-circle text-success me-1" />
          Terang
        </span>
      </section>
      <section className="p-3 overflow-auto flex-grow-1">
        <h2 className="h6">Daftar Titik Lokasi</h2>
        <div className="table-responsive border rounded animation fade-in">
          <MDBTable small hover className="mb-0 align-middle" style={{ minWidth: '760px' }}>
            <MDBTableHead light>
              <tr>
                <th>ID</th>
                <th>Mode</th>
                <th>Foto</th>
                <th>Kondisi</th>
                <th>Lux</th>
                <th>Selesai</th>
                <th>Aksi</th>
              </tr>
            </MDBTableHead>
            <MDBTableBody>
              {markers.map((item, index) => (
                <MarkerRow
                  key={item.id}
                  index={index}
                  data={item}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onMove={onMove}
                  onSelect={onSelect}
                  onViewer={onViewer}
                />
              ))}
            </MDBTableBody>
          </MDBTable>
        </div>
      </section>
      <footer className="p-2 border-top text-center text-muted small">Data tersinkron secara realtime lewat Socket.io</footer>
    </aside>
  )
}
