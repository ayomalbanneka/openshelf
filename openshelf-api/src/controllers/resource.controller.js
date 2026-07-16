import * as resourceService from '../services/resource.service.js';

const list = async (req, res, next) => {
  try {
    const { type, category, language, search, page, limit } = req.query;
    const result = await resourceService.list({ type, category, language, search, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const resource = await resourceService.getOne(req.params.slug);
    res.json(resource);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    // Validation is handled inside the service (courses don't need a main file)
    const resource = await resourceService.create(req.body, files, req.user.id);
    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const resource = await resourceService.update(req.params.slug, req.body, req.user);
    res.json(resource);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await resourceService.remove(req.params.slug, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export { list, getOne, create, update, remove };
