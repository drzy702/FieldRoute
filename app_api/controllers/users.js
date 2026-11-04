const mongoose = require('mongoose');
const User = require('../models/user');
const Booking = require('../models/booking');

const profile = user => ({ _id: user._id, name: user.name, email: user.email, role: user.role || 'customer' });
const validId = id => mongoose.isObjectIdOrHexString(id);

function validate(body, creating) {
  const allowed = creating ? ['name', 'email', 'role', 'password'] : ['name', 'email', 'role'];
  if (!body || Object.keys(body).some(key => !allowed.includes(key))) return 'Unknown user field.';
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 100) return 'Enter a name of 1–100 characters.';
  if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return 'Enter a valid email address.';
  if (!['admin', 'customer'].includes(body.role)) return 'Choose Admin or Customer as the role.';
  if (creating && (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128)) return 'The initial password must be 8–128 characters.';
  return null;
}

const duplicateEmail = (email, exceptId) => User.exists({
  email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  ...(exceptId ? { _id: { $ne: exceptId } } : {}),
});

// Serialize changes so concurrent admin requests cannot remove each other's
// access between the last-admin check and the write in this application server.
let pendingWrite = Promise.resolve();
const accountWrite = handler => (req, res, next) => {
  const operation = pendingWrite.then(async () => {
    const actor = await User.findById(req.auth._id).select('role').lean();
    if (!actor || actor.role !== 'admin') return res.status(403).json({ message: 'An admin account is required.' });
    return handler(req, res);
  });
  pendingWrite = operation.catch(() => {});
  operation.catch(error => {
    if (error.code === 11000) return res.status(409).json({ message: 'That email address is already registered.' });
    return next(error);
  });
};

const read = async (req, res, next) => {
  if (!validId(req.params.userId)) return res.status(400).json({ message: 'Invalid user ID.' });
  try {
    const user = await User.findById(req.params.userId).select('name email role').lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json(profile(user));
  } catch (error) { return next(error); }
};

const create = accountWrite(async (req, res) => {
  const error = validate(req.body, true);
  if (error) return res.status(400).json({ message: error });
  const email = req.body.email.trim().toLowerCase();
  if (await duplicateEmail(email)) return res.status(409).json({ message: 'That email address is already registered.' });
  const user = new User({ name: req.body.name.trim(), email, role: req.body.role });
  user.setPassword(req.body.password);
  await user.save();
  return res.status(201).json(profile(user));
});

const update = accountWrite(async (req, res) => {
  if (!validId(req.params.userId)) return res.status(400).json({ message: 'Invalid user ID.' });
  const error = validate(req.body, false);
  if (error) return res.status(400).json({ message: error });
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  if (user.role === 'admin' && req.body.role !== 'admin') {
    if (await User.countDocuments({ role: 'admin' }) <= 1) return res.status(409).json({ message: 'The last admin cannot be demoted.' });
    if (String(user._id) === String(req.auth._id)) return res.status(409).json({ message: 'You cannot change your own admin role.' });
  }
  const email = req.body.email.trim().toLowerCase();
  if (await duplicateEmail(email, user._id)) return res.status(409).json({ message: 'That email address is already registered.' });
  user.name = req.body.name.trim();
  user.email = email;
  user.role = req.body.role;
  await user.save();
  return res.json(profile(user));
});

const remove = accountWrite(async (req, res) => {
  if (!validId(req.params.userId)) return res.status(400).json({ message: 'Invalid user ID.' });
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  if (user.role === 'admin' && await User.countDocuments({ role: 'admin' }) <= 1) return res.status(409).json({ message: 'The last admin cannot be deleted.' });
  if (String(user._id) === String(req.auth._id)) return res.status(409).json({ message: 'You cannot delete your own account.' });
  if (await Booking.exists({ user: user._id })) return res.status(409).json({ message: 'This user has bookings. Cancel their bookings before deleting the account.' });
  await User.deleteOne({ _id: user._id });
  return res.status(204).end();
});

module.exports = { read, create, update, remove };
