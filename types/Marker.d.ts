export type MarkerType = 'pju' | 'pju_luar' | string

export interface Marker {
  id: number
  name: string
  date: string | Date
  latitude: number
  longitude: number
  photo: string
  photo_360: string
  lux: number | null
  done: number | null
  condition: string
  mode: string
  marker_type: MarkerType
}

export type MarkerChanges = Partial<Omit<Marker, 'id'>>

export interface LocationPoint {
  id: string
  lat: number
  lng: number
  lux?: number
  timestamp?: number
}

export interface MarkerViewerImage {
  type: 'photo' | '360'
  image: string
}

export interface QRViewerImage {
  type: 'qr'
  value: string | number
}

export type ViewerImage = MarkerViewerImage | QRViewerImage | null
