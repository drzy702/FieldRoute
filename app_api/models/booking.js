const mongoose = require("mongoose"); // Import mongoose for schema and model creation

// Define the structure of booking documents
const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, // Reference to a user ID
    ref: "users", // Links to users collection
    required: true, // Must have a user
  },
  tripCode: {
    type: String, // Stores the trip identifier
    required: true, // Must have a trip code
  },
  bookingDate: {
    type: Date, // Date the booking was made
    default: Date.now, // Automatically set current date
  },
});

// Create a unique index so a user can only book the same trip once
bookingSchema.index({ user: 1, tripCode: 1 }, { unique: true });

// Create the Booking model from the schema
const Booking = mongoose.model("bookings", bookingSchema);

// Export the model so it can be used in controllers
module.exports = Booking;
