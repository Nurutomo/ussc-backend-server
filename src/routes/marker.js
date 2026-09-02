import { Router } from 'express'
import { pool } from '../lib/database.js'

const router = Router()


router.get('/', async (req, res) => {
    // Handle fetching marker
    const [rows] = await pool.query('SELECT * FROM marker')
    res.json(rows)
})

router.get('/:id', async (req, res) => {
    // Handle fetching a specific marker
    const { id } = req.params
    const [rows] = await pool.query('SELECT * FROM marker WHERE id = ?', [id])
    res.json(rows)
})

router.post('/', async (req, res) => {
    // Handle adding a marker
    const { name, latitude, longitude } = req.body
    const [result] = await pool.query('INSERT INTO marker (name, latitude, longitude) VALUES (?, ?, ?)', [name, latitude, longitude])
    res.json({ id: result.insertId, name, latitude, longitude })
})
router.put('/:id', async (req, res) => {
    // Handle updating a marker
    const { id } = req.params
    const { name, latitude, longitude } = req.body
    await pool.query('UPDATE marker SET name = ?, latitude = ?, longitude = ? WHERE id = ?', [name, latitude, longitude, id])
    res.json({ id, name, latitude, longitude })
})

router.delete('/:id', async (req, res) => {
    // Handle removing a marker
    const { id } = req.params
    await pool.query('DELETE FROM marker WHERE id = ?', [id])
    res.json({ message: 'Marker removed' })
})

router.use(async (err, req, res, next) => {
  // Middleware to handle errors and set response headers
  const statusCode = err.status || 500
  res.setHeader('Content-Type', 'application/json')
  res.status(statusCode).json({ error: err.message || 'Internal Server Error' })
})

export default router