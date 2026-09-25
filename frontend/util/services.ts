import { io } from 'socket.io-client'
import type { Marker, MarkerChanges, LocationPoint } from '../../types/Marker'

export type MarkerField = 'photo' | 'photo_360'
export type MarkerUpdate = (id: number, changes: MarkerChanges) => void | Promise<void>

export const uploadEvent = async (
  event: React.ChangeEvent<HTMLInputElement>,
  field: MarkerField,
  id: number,
  onUpdate: MarkerUpdate,
  width = 4000,
  quality = 0.4
) => {
  const file = event.target.files?.[0]
  if (file) await onUpdate(id, { [field]: await ImageUtility.compress(file, field === 'photo_360' ? 10000 : width, field === 'photo_360' ? 0.8 : quality) })
  event.target.value = ''
}

export class MarkerApi {
  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`/marker${path}`, options)
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || `Request failed (${response.status})`)
    }
    return response.json()
  }

  json(method: string, body: unknown): RequestInit {
    return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  }

  list(): Promise<Marker[]> {
    return this.request<Marker[]>('')
  }
  create(data: MarkerChanges): Promise<Marker> {
    return this.request<Marker>('', this.json('POST', data))
  }
  update(id: number, data: MarkerChanges): Promise<Marker> {
    return this.request<Marker>(`/${id}`, this.json('PUT', data))
  }
  remove(id: number): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>(`/${id}`, { method: 'DELETE' })
  }
}

export class SocketConnection {
  private client: ReturnType<typeof io>
  constructor() {
    this.client = io()
  }
  on(event: string, handler: (...args: any[]) => void): () => void {
    this.client.on(event, handler)
    return () => this.client.off(event, handler)
  }
  emit(event: string, data?: unknown): void {
    this.client.emit(event, data)
  }
  get id() {
    return this.client.id
  }
}

export class ImageUtility {
  static compress(file: File, maxWidth: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const image = new Image()
        image.onload = () => {
          const scale = Math.min(1, maxWidth / image.width)
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(image.width * scale)
          canvas.height = Math.round(image.height * scale)
          canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        image.onerror = reject
        if (typeof event.target?.result === 'string') image.src = event.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}
