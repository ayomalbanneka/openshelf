require('dotenv').config()

const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const authRoutes = require('./routes/auth.routes')
const resourceRoutes = require('./routes/resource.routes')
const errorHandler = require('./middleware/errorHandler')
const categoryRoutes = require('./routes/category.routes')
const userRoutes = require('./routes/user.routes')

const app = express()

app.use(helmet())
app.use(morgan('dev'))
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/users', userRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Global error handler — must be last
app.use(errorHandler)

module.exports = app

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})