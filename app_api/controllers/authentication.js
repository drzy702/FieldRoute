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

// Method to authenticate our JWT
function authenticateJWT(req, res, next) {
  //console.log('In Middleware');

  const authHeader = req.headers["authorization"];
  //console.log('Auth Header: ' + authHeader);

  if (authHeader == null) {
    console.log("Auth Header Required but NOT PRESENT!");
    return res.sendStatus(401);
  }

  let headers = authHeader.split(" ");
  if (headers.length < 1) {
    console.log("Not enough tokens in Auth Header: " + headers.length);
    return res.sendStatus(501);
  }

  const token = authHeader.split(" ")[1];
  // console.log('Token: ' + token);

  if (token == null) {
    console.log("Null Bearer Token");
    return res.sendStatus(401);
  }

  // console.log(process.env.JWT_SECRET);

  // console.log(jwt.decode(token));
  const verified = jwt.verify(
    token,
    process.env.JWT_SECRET,
    (err, verified) => {
      if (err) {
        return res.sendStatus(401).json("Token Validation Error!");
      }
      req.auth = verified; // Set the auth paramto the decoded object
    },
  );
  next(); // We need to continue or this will hang forever
}

module.exports = {
  register,
  login,
  authenticateJWT,
};
