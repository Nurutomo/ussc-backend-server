import mysql from 'mysql2/promise'
import fs from 'node:fs/promises'

const databaseUrl = process.env.DB_URL ? new URL(process.env.DB_URL) : null
const databaseName = process.env.DB_NAME || databaseUrl?.pathname.replace(/^\//, '')

const connectionConfig = process.env.DB_URL
  ? { uri: process.env.DB_URL }
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME,
    }

export const pool = mysql.createPool({
  ...connectionConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

function escapeIdentifier(identifier) {
  return `\`${identifier.replaceAll('`', '``')}\``
}

async function initializeDatabase() {
  if (!databaseName) throw new Error('DB_NAME or a database name in DB_URL is required')

  const adminConfig = databaseUrl
    ? {
        host: databaseUrl.hostname,
        port: databaseUrl.port ? Number(databaseUrl.port) : 3306,
        user: decodeURIComponent(databaseUrl.username),
        password: decodeURIComponent(databaseUrl.password),
      }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT) || 3306,
      }
  const connection = await mysql.createConnection(adminConfig)

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(databaseName)}`)
  } finally {
    await connection.end()
  }
}

async function initializeMarkerSchema() {
  await initializeDatabase()

  const [tables] = await pool.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'marker'
     LIMIT 1`
  )

  if (!tables.length) {
    const initSql = await fs.readFile(new URL('../../INIT.sql', import.meta.url), 'utf8')
    await pool.query(initSql)
    return
  }

  const [columns] = await pool.query(
    `SELECT COLUMN_NAME, EXTRA
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'marker'
       AND COLUMN_NAME = 'id'`
  )
  const idColumn = columns.find((column) => column.COLUMN_NAME === 'id')

  if (idColumn && !idColumn.EXTRA.includes('auto_increment')) {
    const [primaryKeys] = await pool.query(
      `SELECT 1
       FROM information_schema.table_constraints
       WHERE table_schema = DATABASE() AND table_name = 'marker' AND constraint_type = 'PRIMARY KEY'
       LIMIT 1`
    )
    if (!primaryKeys.length) await pool.query('ALTER TABLE marker ADD PRIMARY KEY (id)')
    await pool.query('ALTER TABLE marker MODIFY id int(11) NOT NULL AUTO_INCREMENT')
  }
}

export const markerSchemaReady = initializeMarkerSchema()
