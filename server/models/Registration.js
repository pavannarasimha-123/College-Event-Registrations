const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      unique: true,
      default: () => `REG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required']
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    participationStatus: {
      type: String,
      enum: ['Registered', 'Attended', 'Cancelled'],
      default: 'Registered'
    }
  },
  {
    timestamps: true
  }
);

// CRITICAL REQUIREMENT: Unique compound index on studentId + eventId
// This guarantees at the database level that a student cannot register twice for the same event
registrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
