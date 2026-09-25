import { MDBBtn } from 'mdb-react-ui-kit'

export default function QR({ value, onClose }) {
  return (
    <div
      className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark d-flex align-items-center justify-content-center animation fade-in"
      style={{ zIndex: 3000 }}
      onClick={onClose}
    >
      <MDBBtn
        color="success"
        className="position-absolute top-0 end-0 m-3"
        style={{ zIndex: 1 }}
        aria-label="Tutup penampil"
        title="Tutup penampil"
        onClick={onClose}
      >
        <i className="fas fa-xmark" />
      </MDBBtn>
      <div style={{ backgroundColor: 'white', borderRadius: '0.25rem', textAlign: 'center' }}>
        <p style={{ color: 'black', textShadow: '1px 1px 2px black', fontSize: '20vh', fontWeight: 'bold', margin: '0' }}>{value}</p>
        <img
          src={`https://quickchart.io/barcode?text=${encodeURIComponent(value.toString().padStart(11, '0'))}&format=svg&type=upca&width=1000&height=200`}
          alt="Barcode"
          style={{
            maxHeight: 'calc(100vh - 2rem - 25vh)',
            maxWidth: '100vw',
            objectFit: 'contain',
          }}
          onClick={(event) => event.stopPropagation()}
        />
        <img
          src={`https://quickchart.io/qr?text=${encodeURIComponent(value)}&format=svg&size=1024&ecLevel=H`}
          alt="QR Code"
          style={{
            minHeight: 'min(20vh, 100vw)',
            maxHeight: 'calc(100vh - 2rem - 25vh)',
            maxWidth: '100vw',
            objectFit: 'contain',
          }}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  )
}
