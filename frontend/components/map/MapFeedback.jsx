import { MDBBadge, MDBBtn } from 'mdb-react-ui-kit'

export default function MapFeedback({ placement, setPlacement, notice, setNotice }) {
  return (
    <>
      {placement && (
        <MDBBadge color="success" className="position-fixed top-0 start-50 translate-middle-x mt-3 p-2 animation fade-in" style={{ zIndex: 2100 }}>
          {placement.kind === 'create' ? 'Klik peta untuk membuat marker' : 'Klik peta untuk memindahkan marker'}{' '}
          <MDBBtn color="light" size="sm" aria-label="Batalkan penempatan" title="Batalkan penempatan" onClick={() => setPlacement(null)}>
            <i className="fas fa-xmark" />
          </MDBBtn>
        </MDBBadge>
      )}
      {notice && (
        <MDBBadge
          color="danger"
          className="position-fixed top-0 start-50 translate-middle-x mt-5 p-3 animation fade-in"
          style={{ zIndex: 2100, cursor: 'pointer' }}
          onClick={() => setNotice(null)}
        >
          {notice}
        </MDBBadge>
      )}
    </>
  )
}
