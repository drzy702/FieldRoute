const fs = require('fs');
const path = require('path');
const Page = require('../models/page');
const defaults = require('../../data/site-pages.json');

const getDefinition = slug => Object.hasOwn(defaults, slug) ? defaults[slug] : null;
const present = (definition, saved) => ({
  ...definition,
  updatedAt: saved?.updatedAt || null,
  fields: definition.fields.map(field => ({
    ...field, value: saved?.values?.[field.key] ?? field.value,
  })),
});

const read = async (req, res, next) => {
  const definition = getDefinition(req.params.slug);
  if (!definition) return res.status(404).json({ message: 'Page not found.' });
  try {
    const saved = await Page.findOne({ slug: req.params.slug }).lean();
    res.set('Cache-Control', 'no-store');
    return res.json(present(definition, saved));
  } catch (error) { return next(error); }
};

const update = async (req, res, next) => {
  const definition = getDefinition(req.params.slug);
  if (!definition) return res.status(404).json({ message: 'Page not found.' });
  const values = req.body.values;
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return res.status(400).json({ message: 'Page values are required.' });
  }
  const allowedKeys = new Set(definition.fields.map(field => field.key));
  if (Object.keys(values).some(key => !allowedKeys.has(key))) {
    return res.status(400).json({ message: 'Unknown page field.' });
  }
  for (const field of definition.fields) {
    const value = values[field.key];
    if (typeof value !== 'string' || !value.trim() || value.length > 20000) {
      return res.status(400).json({ message: `${field.label} is required and must be under 20,000 characters.` });
    }
    if (field.type === 'image' && (
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(jpg|jpeg|png|webp|gif)$/i.test(value) ||
      !fs.existsSync(path.join(__dirname, '../../public/images', value))
    )) {
      return res.status(400).json({ message: `${field.label}: choose an existing site image.` });
    }
  }
  try {
    const saved = await Page.findOneAndUpdate(
      { slug: req.params.slug }, { $set: { values } },
      { upsert: true, new: true, runValidators: true },
    ).lean();
    return res.json(present(definition, saved));
  } catch (error) { return next(error); }
};

const images = (req, res, next) => {
  fs.readdir(path.join(__dirname, '../../public/images'), (error, files) => {
    if (error) return next(error);
    return res.json(files.filter(file =>
      /\.(jpg|jpeg|png|webp|gif)$/i.test(file) && !/^(bg-|btn-|content-box|icons|logo|searchbar)/i.test(file)
    ).sort());
  });
};

module.exports = { read, update, images };
