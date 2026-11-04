const User = require('../models/user');
const Trip = require('../models/travlr');
const Page = require('../models/page');
const defaults = require('../../data/site-pages.json');

const summary = async (req, res, next) => {
  try {
    const [trips, users, editedPages] = await Promise.all([
      Trip.countDocuments(), User.countDocuments(), Page.countDocuments(),
    ]);
    res.json({ trips, users, pages: Object.keys(defaults).length, editedPages });
  } catch (error) { next(error); }
};

const users = async (req, res, next) => {
  try {
    const users = await User.find().select('name email role').sort({ name: 1, email: 1 }).lean();
    res.json(users);
  } catch (error) { next(error); }
};

module.exports = { summary, users };
