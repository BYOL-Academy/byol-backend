import express, { Application } from 'express'
import type { Request, Response } from 'express-serve-static-core'
import { globalErrorHandler, notFoundHandler } from '@/handlers'
import { loggerMiddleware, responseFormatter } from '@/middlewares'
const app: Application = express()
import { env } from '@/utils/env.util'
import path from 'path'
import 'colors'
import fs from 'fs'
import { RouteAssembly } from '@/utils'
// Middleware to parse JSON bodies
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middleware to format json responses
app.use(responseFormatter)

// Middleware for logging
app.use(loggerMiddleware)

// Register class based routes
app.use('/api/v1', RouteAssembly.createRouter())

// Register functional based routes
// app.use('/api/v1', routes)

// 404 Fallback Middleware (Handles unmatched routes)
app.use(notFoundHandler) // Register the 404 handler as the last middleware

// Catch all unhandled errors and send a generic error response
app.use(globalErrorHandler)

// Serve frontend
const isDevelopment = env.nodeEnvironment === 'development'
if (!isDevelopment) {
  const distDir = path.join(__dirname, '../frontend/dist')
  fs.access(distDir, fs.constants.F_OK, (err) => {
    console.log(`${distDir.black.bgWhite} ${err ? 'does not exist'.black.bgRed : 'exists'.black.bgWhite}`)
  })
  app.use(
    express.static(path.join(__dirname, '../frontend/dist'), {
      maxAge: '1d', // Cache static files for 1 day
      etag: true,
      lastModified: true,
    })
  )
  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../', 'frontend', 'dist', 'index.html')))
} else {
  app.get('/', (req: Request, res: Response): any => res.send('Please set to production'))
}
export default app
