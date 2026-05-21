require('dotenv').config()

const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const metricsMiddleware = require('./middleware/metrics');

const authRoutes = require('./routes/auth.routes');
const resourceRoutes = require('./routes/resource.routes');
const errorHandler = require('./middleware/errorHandler'); 
const categoryRoutes = require('./routes/category.routes');
const userRoutes = require('./routes/user.routes');
const readingListRoutes = require('./routes/readingList.routes');
const clubRoutes = require('./routes/club.routes');
const tagRoutes = require('./routes/tag.routes');
const adminRoutes = require('./routes/admin.routes');
const progressRoutes = require('./routes/progress.routes');
const commentRoutes = require('./routes/comment.routes');
const metricsRoutes   = require('./routes/metrics.routes');
const reportRoutes = require('./routes/report.routes');

let configureIndex
if (process.env.NODE_ENV !== 'test') {
  ; ({ configureIndex } = require('./config/meilisearch'))
}

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(morgan('dev'))
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
app.use(metricsMiddleware)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV })
})

// Configure Meilisearch index on startup
if (configureIndex) {
  configureIndex()
}

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
app.use('/api', commentRoutes)
app.use('/metrics', metricsRoutes)
app.use('/api', reportRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Global error handler — must be last
app.use(errorHandler)

module.exports = app

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}