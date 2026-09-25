import { Server } from 'socket.io'
import http from 'http'

// Wires up the live-location and marker-broadcast events on top of an
// existing HTTP server. Returns the socket.io server instance.
export function attachSocket(server: http.Server): Server {
  const io = new Server(server)
  const liveLocations = new Map<string, any>()

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)
    const sendLiveLocations = () => socket.emit('point.location.snapshot', Array.from(liveLocations.values()))
    sendLiveLocations()
    socket.on('point.location.request', sendLiveLocations)

    socket.on('disconnect', () => {
      liveLocations.delete(socket.id)
      io.emit('point.location.remove', socket.id)
    })
    socket.on('marker.add', (msg) => {
      console.log('marker.add', msg)
      io.emit('marker.add', msg)
    })
    socket.on('marker.remove', (msg) => {
      console.log('marker.remove', msg)
      io.emit('marker.remove', msg)
    })
    socket.on('marker.update', (msg) => {
      console.log('marker.update', msg)
      io.emit('marker.update', msg)
    })
    socket.on('point.location', (msg) => {
      if (msg?.lat == null || msg?.lng == null) return

      const location = {
        id: socket.id,
        lat: Number(msg.lat),
        lng: Number(msg.lng),
        lux: msg.lux ?? 0,
        timestamp: msg.timestamp || Date.now(),
      }
      if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) return

      liveLocations.set(socket.id, location)
      io.emit('point.location', location)
    })
  })

  return io
}
