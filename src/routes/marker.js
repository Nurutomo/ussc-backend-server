import { Router } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool, markerSchemaReady } from '../lib/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, '../../public')
const imgDir = path.join(publicDir, 'img')

const router = Router()

async function ensureImageDirectory() {
  await fs.mkdir(imgDir, { recursive: true })
}

async function saveImageToDisk(imageValue, fieldName) {
  if (!imageValue || typeof imageValue !== 'string') return ''

  if (imageValue.startsWith('data:image/')) {
    const match = imageValue.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) return imageValue

    const [, mimeType, base64Data] = match
    const extension = mimeType === 'jpeg' ? 'jpg' : mimeType === 'svg+xml' ? 'svg' : mimeType
    const filename = `${fieldName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

    await ensureImageDirectory()
    await fs.writeFile(path.join(imgDir, filename), Buffer.from(base64Data, 'base64'))
    return `/img/${filename}`
  }

  return imageValue
}

router.get('/', async (req, res, next) => {
  try {
    await markerSchemaReady
    const [rows] = await pool.query('SELECT * FROM marker ORDER BY id ASC')
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    await markerSchemaReady
    const { id } = req.params
    const [rows] = await pool.query('SELECT * FROM marker WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Marker not found' })
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    await markerSchemaReady
    const { name, latitude, longitude, condition, lux, photo, photo_360, date, marker_type } = req.body

    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'latitude and longitude are required' })
    }

    const finalName = name || `Titik ${new Date().toLocaleString()}`
    const finalCondition = condition || 'Terang'
    const finalLux = lux != null ? lux : 0
    const finalMarkerType = marker_type || 'pju'
    const finalPhoto = await saveImageToDisk(photo, 'photo')
    const finalPhoto360 = await saveImageToDisk(photo_360, 'photo_360')
    const finalDate = new Date(date || Date.now())

    const [result] = await pool.query(
      `INSERT INTO marker (name, latitude, longitude, \`condition\`, lux, photo, photo_360, date, mode, marker_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalName, latitude, longitude, finalCondition, finalLux, finalPhoto, finalPhoto360, finalDate, finalMarkerType, finalMarkerType]
    )

    console.log(result)

    const [rows] = await pool.query('SELECT * FROM marker WHERE id = ?', [result.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    await markerSchemaReady
    const { id } = req.params
    const { name, latitude, longitude, condition, lux, photo, photo_360, done, marker_type } = req.body

    const [existing] = await pool.query('SELECT * FROM marker WHERE id = ?', [id])
    if (!existing.length) return res.status(404).json({ error: 'Marker not found' })
    const current = existing[0]

    const merged = {
      name: name !== undefined ? name : current.name,
      latitude: latitude !== undefined ? latitude : current.latitude,
      longitude: longitude !== undefined ? longitude : current.longitude,
      condition: condition !== undefined ? condition : current.condition,
      lux: lux !== undefined ? lux : current.lux,
      photo: photo !== undefined ? await saveImageToDisk(photo, 'photo') : current.photo,
      photo_360: photo_360 !== undefined ? await saveImageToDisk(photo_360, 'photo_360') : current.photo_360,
      done: done !== undefined ? done : current.done,
      marker_type: marker_type !== undefined ? marker_type : current.marker_type || 'pju',
    }

    await pool.query(
      `UPDATE marker
      SET name = ?, latitude = ?, longitude = ?, \`condition\` = ?, lux = ?, photo = ?, photo_360 = ?, done = ?, marker_type = ?
       WHERE id = ?`,
      [
        merged.name,
        merged.latitude,
        merged.longitude,
        merged.condition,
        merged.lux,
        merged.photo,
        merged.photo_360,
        merged.done,
        merged.marker_type,
        id,
      ]
    )

    const [rows] = await pool.query('SELECT * FROM marker WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await markerSchemaReady
    const { id } = req.params
    await pool.query('DELETE FROM marker WHERE id = ?', [id])
    res.json({ message: 'Marker removed', id: Number(id) })
  } catch (err) {
    next(err)
  }
})

router.use((err, req, res, next) => {
  // Middleware to handle errors and set response headers
  const statusCode = err.status || 500
  res.setHeader('Content-Type', 'application/json')
  res.status(statusCode).json({ error: err.message || 'Internal Server Error' })
})

export default router
