import 'dotenv/config'
import startServer from './src/server.js'

startServer(process.env.PORT || 3000)
