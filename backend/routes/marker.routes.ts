import { Router } from 'express'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { pool, markerSchemaReady } from '../db/database.js'
import { saveImageToDisk, removeImageFromDisk } from '../services/image-storage.service.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    await markerSchemaReady
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM marker ORDER BY id ASC')
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    await markerSchemaReady
    const { id } = req.params
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM marker WHERE id = ?', [id])
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
    const finalDate = new Date(date || Date.now())

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO marker (name, latitude, longitude, \`condition\`, lux, photo, photo_360, date, mode, marker_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalName, latitude, longitude, finalCondition, finalLux, '', '', finalDate, finalMarkerType, finalMarkerType]
    )

    const finalPhoto = await saveImageToDisk(photo, 'photo', result.insertId)
    const finalPhoto360 = await saveImageToDisk(photo_360, 'photo_360', result.insertId)
    await pool.query('UPDATE marker SET photo = ?, photo_360 = ? WHERE id = ?', [finalPhoto, finalPhoto360, result.insertId])

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM marker WHERE id = ?', [result.insertId])
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

    const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM marker WHERE id = ?', [id])
    if (!existing.length) return res.status(404).json({ error: 'Marker not found' })
    const current = existing[0]

    let nextPhoto = current.photo
    let nextPhoto360 = current.photo_360
    let oldPhoto
    let oldPhoto360
    if (photo !== undefined) {
      nextPhoto = photo ? await saveImageToDisk(photo, 'photo', id) : ''
      oldPhoto = current.photo
    }
    if (photo_360 !== undefined) {
      nextPhoto360 = photo_360 ? await saveImageToDisk(photo_360, 'photo_360', id) : ''
      oldPhoto360 = current.photo_360
    }

    const merged = {
      name: name !== undefined ? name : current.name,
      latitude: latitude !== undefined ? latitude : current.latitude,
      longitude: longitude !== undefined ? longitude : current.longitude,
      condition: condition !== undefined ? condition : current.condition,
      lux: lux !== undefined ? lux : current.lux,
      photo: nextPhoto,
      photo_360: nextPhoto360,
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

    if (oldPhoto && oldPhoto !== merged.photo) await removeImageFromDisk(oldPhoto)
    if (oldPhoto360 && oldPhoto360 !== merged.photo_360) await removeImageFromDisk(oldPhoto360)

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
    const [existing] = await pool.query<RowDataPacket[]>('SELECT photo, photo_360 FROM marker WHERE id = ?', [id])
    if (!existing.length) return res.status(404).json({ error: 'Marker not found' })
    await pool.query('DELETE FROM marker WHERE id = ?', [id])
    await removeImageFromDisk(existing[0].photo)
    await removeImageFromDisk(existing[0].photo_360)
    res.json({ message: 'Marker removed', id: Number(id) })
  } catch (err) {
    next(err)
  }
})

export default router
