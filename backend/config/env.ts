// Centralizes access to process.env so the rest of the app never reads
// environment variables directly. Add new variables here as they're needed.
export const env = {
  port: Number(process.env.PORT) || 3000,
  db: {
    url: process.env.DB_URL || null,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME,
  },
}
