const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      unique: true,
      default: () => `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    },
    eventTitle: {
      type: String,
      required: [true, 'Event Title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    eventDate: {
      type: Date,
      required: [true, 'Event Date is required']
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true
    },
    maximumParticipants: {
      type: Number,
      required: [true, 'Maximum Participants is required'],
      min: [1, 'Maximum participants must be at least 1']
    }
  },
  {
    timestamps: true
  }
);

// Virtual for registration count and availability can be populated or computed
eventSchema.index({ eventDate: 1 });
eventSchema.index({ category: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
