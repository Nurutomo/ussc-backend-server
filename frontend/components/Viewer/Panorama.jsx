import { useEffect, useRef } from 'react'
import { MDBBtn } from 'mdb-react-ui-kit'

export default function Panorama({ image, onClose }) {
  const target = useRef(null)
  useEffect(() => {
    const viewer = window.pannellum.viewer(target.current, {
      type: 'equirectangular',
      panorama: image,
      autoLoad: true,
      showControls: true,
      compass: true,
    })
    return () => viewer.destroy()
  }, [image])
  return (
    <div className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark animation fade-in" style={{ zIndex: 3000 }}>
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
      <div ref={target} style={{ height: '100%' }} />
    </div>
  )
}
