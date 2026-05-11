require('dotenv').config()

const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const authRoutes = require('./routes/auth.routes'); // Authentication routes (register, login, logout)
const resourceRoutes = require('./routes/resource.routes'); // Routes for managing resources (books, articles, etc.)
const errorHandler = require('./middleware/errorHandler'); // Global error handling middleware
const categoryRoutes = require('./routes/category.routes'); // Routes for managing categories (genres, topics, etc.)
const userRoutes = require('./routes/user.routes'); // Routes for user profiles, following, etc.
const readingListRoutes = require('./routes/readingList.routes'); // Routes for managing reading lists (create, update, delete, add/remove resources)
const clubRoutes = require('./routes/club.routes'); // Routes for book clubs (create club, join/leave club, discussions, comments)
const tagRoutes = require('./routes/tag.routes'); // Routes for managing tags (create, list)
const adminRoutes = require('./routes/admin.routes'); // Routes for admin dashboard and content moderation
const progressRoutes = require('./routes/progress.routes'); // Routes for tracking reading progress
const {configureIndex} = require('./config/meilisearch')

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

// Configure Meilisearch index on startup
configureIndex();

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/users', userRoutes)
app.use('/api/lists', readingListRoutes)
app.use('/api/clubs', clubRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/progress', progressRoutes)

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