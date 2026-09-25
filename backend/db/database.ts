import mysql from 'mysql2/promise'
import type { RowDataPacket } from 'mysql2'
import fs from 'node:fs/promises'
import { env } from '../config/env.js'

const databaseUrl = env.db.url ? new URL(env.db.url) : null
const databaseName = env.db.name || databaseUrl?.pathname.replace(/^\//, '')

const connectionConfig = env.db.url
  ? { uri: env.db.url }
  : {
      host: env.db.host,
      user: env.db.user,
      password: env.db.password,
      port: env.db.port,
      database: env.db.name,
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
        host: env.db.host,
        user: env.db.user,
        password: env.db.password,
        port: env.db.port,
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

  const [tables] = await pool.query<RowDataPacket[]>(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'marker'
     LIMIT 1`
  )

  if (!tables.length) {
    const initSql = await fs.readFile(new URL('../../database/init.sql', import.meta.url), 'utf8')
    await pool.query(initSql)
    return
  }

  const [columns] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME, EXTRA
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'marker'
       AND COLUMN_NAME = 'id'`
  )
  const idColumn = columns.find((column) => column.COLUMN_NAME === 'id')

  if (idColumn && !idColumn.EXTRA.includes('auto_increment')) {
    const [primaryKeys] = await pool.query<RowDataPacket[]>(
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
