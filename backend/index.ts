import 'dotenv/config'
import { createApp } from './app.js'
import { attachSocket } from './realtime/socket.js'
import { env } from './config/env.js'
import express from 'express'
import http from 'http'

const app: express.Express = createApp()

const server: http.Server = app.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`)
})

attachSocket(server)

export { app, server }
