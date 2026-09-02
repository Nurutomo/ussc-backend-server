import express from 'express'
import { Server } from 'socket.io'
import { Marker } from './routes/index.js'

export default function startServer(port = 3000) {
  const app = express()

  app.set('view engine', 'ejs')
  
  app.use(express.json())
  app.use('/marker', Marker.default)
  
  app.get('/', (req, res) => {
    res.render('index')
  })

  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
  const io = new Server(server)
  io.on('connection', (socket) => {
    console.log('A user connected')
    socket.on('marker.add', (msg) => {
      io.emit('marker.add', msg)
    })
    socket.on('marker.remove', (msg) => {
      io.emit('marker.remove', msg)
    })
    socket.on('marker.update', (msg) => {
      io.emit('marker.update', msg)
    })
  })

  return { app, server, io }
}