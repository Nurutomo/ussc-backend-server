import express from 'express'
import morgan from 'morgan'
import { Marker } from './routes/index.js'

export function createApp(): express.Express {
  const app: express.Express = express()

  app.use(morgan('dev'))
  app.use(express.json({ limit: '30mb' })) // large limit: markers can carry base64 photos
  // Serves the built frontend (npm run build) and, at the same path, the
  // uploaded marker images written by the image-storage service.
  app.use(express.static('public'))
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('CDN-Cache-Control', 'no-store'); // Khusus instruksi untuk Cloudflare
    next();
});
  app.use(express.static('frontend/build'))

  app.use('/marker', Marker.default)

  // Centralized error handler (must be registered last)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = err.status || 500
    res.status(statusCode).json({ error: err.message || 'Internal Server Error' })
  })

  return app
}
