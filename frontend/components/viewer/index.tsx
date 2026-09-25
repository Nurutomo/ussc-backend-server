import React from 'react'
import { ViewerImage } from '../../../types/Marker'
import Panorama from './Panorama'
import Photo from './Photo'
import QR from './QR'

export default function Viewer({
  viewerImage,
  setViewerImage,
}: {
  viewerImage: ViewerImage
  setViewerImage: React.Dispatch<React.SetStateAction<ViewerImage>>
}) {
  return (
    <>
      {viewerImage?.type === '360' && <Panorama image={viewerImage.image} onClose={() => setViewerImage(null)} />}
      {viewerImage?.type === 'photo' && <Photo image={viewerImage.image} onClose={() => setViewerImage(null)} />}
      {viewerImage?.type === 'qr' && <QR value={viewerImage.value} onClose={() => setViewerImage(null)} />}
    </>
  )
}
