import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export const markerSchemaReady = pool.query(
  `ALTER TABLE marker ADD COLUMN marker_type VARCHAR(32) NOT NULL DEFAULT 'pju'`
).catch((error) => {
  if (error.code !== 'ER_DUP_FIELDNAME') throw error
})
