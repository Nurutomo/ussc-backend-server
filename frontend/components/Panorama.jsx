import { useEffect, useRef } from 'react'

export default function Panorama({ image, onClose }) {
  const target = useRef(null)
  useEffect(() => {
    const viewer = window.pannellum.viewer(target.current, { type: 'equirectangular', panorama: image, autoLoad: true, showControls: true, compass: true })
    return () => viewer.destroy()
  }, [image])
  return <div className="panorama"><button onClick={onClose}>Tutup</button><div ref={target} /></div>
}
