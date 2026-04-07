const resourceService = require('../services/resource.service')

const list = async (req, res, next) => {
  try {
    const { type, category, language, search, page, limit } = req.query
    const result = await resourceService.list({ type, category, language, search, page, limit })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const getOne = async (req, res, next) => {
  try {
    const resource = await resourceService.getOne(req.params.slug)
    res.json(resource)
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' })
    }

    const resource = await resourceService.create(req.body, req.file, req.user.id)
    res.status(201).json(resource)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const resource = await resourceService.update(req.params.slug, req.body, req.user)
    res.json(resource)
  } catch (err) {
    next(err)
  }
}

const publish = async (req, res, next) => {
  try {
    const resource = await resourceService.publish(req.params.slug)
    res.json(resource)
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    const result = await resourceService.remove(req.params.slug, req.user)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getOne, create, update, publish, remove }