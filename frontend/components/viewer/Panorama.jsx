import { useEffect, useRef } from 'react'
import { MDBBtn } from 'mdb-react-ui-kit'

export default function Panorama({ image, onClose }) {
  const target = useRef(null)
  useEffect(() => {
    const controller = new AbortController()
    let viewer
    let cancelled = false

    const initialize = async () => {
      try {
        const config = image.endsWith('.json')
          ? await fetch(image, { signal: controller.signal }).then((response) => {
              if (!response.ok) throw new Error(`Gagal memuat konfigurasi panorama (${response.status})`)
              return response.json()
            })
          : {
              type: 'equirectangular',
              panorama: image,
              autoLoad: true,
              showControls: true,
              compass: true,
            }

        if (cancelled || !target.current) return
        viewer = window.pannellum.viewer(target.current, config)
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') console.error('Gagal memuat panorama:', error)
      }
    }

    initialize()
    return () => {
      cancelled = true
      controller.abort()
      viewer?.destroy()
      viewer = undefined
    }
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
