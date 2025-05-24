import express from 'express'
import apiHealthRoute from './api_health'
import { RouteAssembly } from '@/utils/route-assembly.util.js'

const router = express.Router()
router.use('/status', apiHealthRoute)

// Add ping route
router.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
  })
})
// RouteAssembly.registerRoute(router)

// router.use('/status', apiHealthRoute)
export default router
