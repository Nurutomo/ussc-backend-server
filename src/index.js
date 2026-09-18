import 'dotenv/config'
import { createApp } from './app.js'
import { attachSocket } from './realtime/socket.js'
import { env } from './config/env.js'

const app = createApp()

const server = app.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`)
})

attachSocket(server)

export { app, server }
