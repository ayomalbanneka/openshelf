const error = (err, req, res, next) => {
    console.error(err.stack);

    if (err.code === 'P2002') {
        return res.status(409).json({
            message: 'A record with this value already exists.',
        })
    }

    // Prisma record not found
    if (err.code === 'P2025') {
        return res.status(404).json({
            message: 'Record not found',
        })
    }

    const status = err.status || err.statusCode || 500
    const message = err.message || 'Internal server error'

    res.status(status).json({
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
}

module.exports = errorHandler = error