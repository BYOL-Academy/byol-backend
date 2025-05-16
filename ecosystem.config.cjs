require('dotenv').config()

module.exports = {
  apps: [
    {
      name: 'byol',
      script: './dist/src/server.js',
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss SSS',
      autorestart: true,
      env: {
        NODE_ENV: process.env.VITE_NODE_ENV,
        PORT: process.env.VITE_PORT,
      },
      version: '0.0.1',
    },
  ],
}
