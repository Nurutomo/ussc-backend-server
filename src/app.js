import express from 'express'
import morgan from 'morgan'
import { Marker } from './routes/index.js'

export function createApp() {
  const app = express()

  app.use(morgan('dev'))
  app.use(express.json({ limit: '30mb' })) // large limit: markers can carry base64 photos
  // Serves the built frontend (npm run build) and, at the same path, the
  // uploaded marker images written by the image-storage service.
  app.use(express.static('buildReact'))
  app.use(express.static('public'))

  app.use('/marker', Marker.default)

  // Centralized error handler (must be registered last)
  app.use((err, req, res, next) => {
    const statusCode = err.status || 500
    res.status(statusCode).json({ error: err.message || 'Internal Server Error' })
  })

  return app
}
