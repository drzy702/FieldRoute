const Booking = require("../models/booking"); // Booking model (stores user bookings)
const Trip = require("../models/travlr"); // Trip model (used to get trip details)
const jwt = require("jsonwebtoken"); // Used to decode and verify JWT tokens

// Create a new booking
const createBooking = async (req, res) => {
  try {
    // Get token from request header and decode it
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user already booked this trip
    const existing = await Booking.findOne({
      user: decoded._id,
      tripCode: req.body.tripCode,
    });

    // If booking already exists, return error
    if (existing) {
      return res.status(400).json({ message: "Already booked this trip" });
    }

    // Create a new booking
    const booking = new Booking({
      user: decoded._id,
      tripCode: req.body.tripCode,
    });

    // Save booking to database
    await booking.save();

    return res.status(201).json({ message: "Booking created" });
  } catch (err) {
    console.error(err);

    // Handle duplicate key error (extra safety)
    if (err.code === 11000) {
      return res.status(400).json({ message: "Already booked this trip" });
    }

    // General error
    return res.status(500).json({ message: "Error creating booking" });
  }
};

// Get all bookings for the logged-in user
const getMyBookings = async (req, res) => {
  try {
    // Decode user from token
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find bookings for this user
    const bookings = await Booking.find({ user: decoded._id }).lean();

    // Get all trip codes from bookings
    const tripCodes = bookings.map((booking) => booking.tripCode);

    // Find matching trips from Trip collection
    const trips = await Trip.find({ code: { $in: tripCodes } }).lean();

    // Combine booking info with trip details
    const results = bookings.map((booking) => {
      const trip = trips.find((t) => t.code === booking.tripCode);

      return {
        _id: booking._id,
        tripCode: booking.tripCode,
        bookingDate: booking.bookingDate,
        trip: trip || null, // Attach trip info if found
      };
    });

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error getting bookings" });
  }
};

// Delete a booking
const deleteBooking = async (req, res) => {
  try {
    // Decode user from token
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const bookingId = req.params.bookingId; // Get booking ID from URL

    // Delete booking only if it belongs to this user
    const deleted = await Booking.findOneAndDelete({
      _id: bookingId,
      user: decoded._id,
    });

    // If no booking found, return error
    if (!deleted) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ message: "Booking deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error deleting booking" });
  }
};

// Export all controller functions
module.exports = {
  createBooking,
  getMyBookings,
  deleteBooking,
};
