import { createServer } from 'http'
import { env } from '@/utils'
import { logger } from '@/utils/logger.util'
import app from '@/app'
import { databaseClient } from '@/database'
import 'colors'

async function main() {
  // Start the sever timer
  const startTime = process.hrtime()

  const server = createServer(app)

  // Initialize database connection
  await databaseClient.connect()

  const { port, appName, nodeEnvironment } = env
  await new Promise((resolve) => {
    server.listen(port, () => {
      const url = `${process.env.VITE_LOCALHOST}:${process.env.VITE_PORT}`
      const elapsedTime = process.hrtime(startTime)
      const seconds = elapsedTime[0]
      const milliseconds = Math.round(elapsedTime[1] / 1e6)
      logger.debug(`Starting ${appName}`)
      logger.debug(`Running in ${nodeEnvironment} mode`)
      logger.debug(`Server is running on port ${port} ⬆️ ⬆️ ⬆️`)
      console.log(`${'Listening on:'} ${url} ${`(in ${process.env.VITE_NODE_ENV})`.black.bgGreen} ${`ready in`.gray} ${seconds}.${milliseconds}s`.black.bgGreen)
      resolve(true)
    })
  })
  // Graceful shutdown server function
  function gracefulShutdown() {
    console.log('\x1b[32m➜\x1b[0m  Received shutdown signal, gracefully shutting down...')
    // Close HTTP server
    server.close(() => {
      console.log('\x1b[32m➜\x1b[0m  HTTP server closed')
    })

    // Forcefully exit after a timeout (e.g., 30 seconds)
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down'.white.bgRed)
      process.exit(1)
    }, 30000)
  }
  // Register shutdown handlers
  process.on('SIGTERM', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)
}
main()
