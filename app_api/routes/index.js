const express = require("express"); // Express app
const router = express.Router(); // Router logic
//const jwt = require('jsonwebtoken'); // Enable JSON Web Tokens

const tripsController = require("../controllers/trips");
const authController = require("../controllers/authentication");
const bookingController = require('../controllers/booking');
const adminController = require('../controllers/admin');
const pagesController = require('../controllers/pages');
const usersController = require('../controllers/users');

router.get('/admin/summary', authController.authenticateJWT, authController.requireAdmin, adminController.summary);
router.route('/admin/users')
  .get(authController.authenticateJWT, authController.requireAdmin, adminController.users)
  .post(authController.authenticateJWT, authController.requireAdmin, usersController.create);
router.route('/admin/users/:userId')
  .get(authController.authenticateJWT, authController.requireAdmin, usersController.read)
  .put(authController.authenticateJWT, authController.requireAdmin, usersController.update)
  .delete(authController.authenticateJWT, authController.requireAdmin, usersController.remove);
router.get('/admin/images', authController.authenticateJWT, authController.requireAdmin, pagesController.images);
router.route('/pages/:slug')
  .get(pagesController.read)
  .put(authController.authenticateJWT, authController.requireAdmin, pagesController.update);

router.route("/register").post(authController.register);
router.route("/login").post(authController.login);
router.route('/bookings')
  .post(authController.authenticateJWT, bookingController.createBooking)
  .get(authController.authenticateJWT, bookingController.getMyBookings);
router.route('/bookings/:bookingId')
  .delete(authController.authenticateJWT, bookingController.deleteBooking);

// define route for our trips endpoint
router
    .route("/trips")
    .get(tripsController.tripsList) // GET Method routes tripList
    .post(authController.authenticateJWT, authController.requireAdmin, tripsController.tripsAddTrip); // POST Method Adds a Trip

// GET method routes tripsFindByCode - requires parameter
// PUT Method routes tripsUpdateTrip - requres parameter
router
    .route('/trips/:tripCode')
    .get(tripsController.tripsFindByCode)
    .put(authController.authenticateJWT, authController.requireAdmin, tripsController.tripsUpdateTrip)
    // Delete a trip (protected route)
    .delete(authController.authenticateJWT, authController.requireAdmin, tripsController.tripsDeleteTrip);


module.exports = router;
