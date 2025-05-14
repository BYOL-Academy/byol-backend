import express from 'express'
import apiHealthRoute from './api_health.js'

const router = express.Router()

router.use('/status', apiHealthRoute)
export default router
