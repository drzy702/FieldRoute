const passport = require("passport");
const mongoose = require("mongoose");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  // Validate message to ensure that all parameters are present
  if (!req.body.name || !req.body.email || !req.body.password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const user = new User({
    name: req.body.name, // Set user name
    email: req.body.email, // Set e-mail address
    role: "customer",
  });

  // Set user password
  user.setPassword(req.body.password);
  const q = await user.save();

  // if (!q) {
  //   // Database returned no data
  //   return res.status(400).json(err);
  // } else {
  //   // Return new user token
  //   const token = user.generateJWT();
  //   return res.status(200).json({ token });
  // }

  if (!q) {
    return res.status(400).json(err);
  } else {
    const token = user.generateJWT();
    console.log("register token:", token);
    return res.status(200).json({ token });
  }
};

const login = (req, res) => {
  // Validate message to ensure that email and password are present.
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: "All fields required" });
  }

  // Delegate authentication  to passport module
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      // Error in Authentication Process
      return res.status(404).json(err);
    }

    if (user) {
      // Auth succeeded - generate JWT and return to caller
      const token = user.generateJWT();
      res.status(200).json({ token });
    } else {
      // Auth failed return error
      res.status(401).json(info);
    }
  })(req, res);
};

// Authenticate before continuing into protected handlers.
async function authenticateJWT(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ message: 'Please log in.' });
  try {
    req.auth = jwt.verify(match[1], process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
  try {
    if (!mongoose.isObjectIdOrHexString(req.auth._id)) return res.status(401).json({ message: 'Invalid session. Please log in again.' });
    const user = await User.findById(req.auth._id).select('name email role').lean();
    if (!user) return res.status(401).json({ message: 'This account no longer exists.' });
    // Use the current role rather than an old role embedded in a signed token.
    req.auth = { ...req.auth, ...user, role: user.role || 'customer' };
  } catch (error) { return next(error); }
  return next();
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ message: 'An admin account is required.' });
  }
  return next();
}

module.exports = { register, login, authenticateJWT, requireAdmin };
