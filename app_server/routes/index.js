var express = require("express");
var router = express.Router();
const ctrlMain = require("../controllers/main");
const ctrlAuth = require("../controllers/auth");

/* GET home page. */
router.get("/", ctrlMain.index);

router.get("/login", ctrlAuth.login);

router.get("/register", ctrlAuth.register);

router.get("/bookings", (req, res) => {
  res.render("bookings", { title: "My Bookings" });
});

module.exports = router;
