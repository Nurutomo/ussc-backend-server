import { io } from 'socket.io-client'

export class MarkerApi {
  async request(path, options = {}) {
    const response = await fetch(`/marker${path}`, options)
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || `Request failed (${response.status})`)
    }
    return response.json()
  }

  json(method, body) {
    return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  }

  list() { return this.request('') }
  create(data) { return this.request('', this.json('POST', data)) }
  update(id, data) { return this.request(`/${id}`, this.json('PUT', data)) }
  remove(id) { return this.request(`/${id}`, { method: 'DELETE' }) }
}

export class SocketConnection {
  constructor() { this.client = io() }
  on(event, handler) { this.client.on(event, handler); return () => this.client.off(event, handler) }
  emit(event, data) { this.client.emit(event, data) }
  get id() { return this.client.id }
}

export class ImageUtility {
  static compress(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = event => {
        const image = new Image()
        image.onload = () => {
          const scale = Math.min(1, maxWidth / image.width)
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(image.width * scale)
          canvas.height = Math.round(image.height * scale)
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        image.onerror = reject
        image.src = event.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}
