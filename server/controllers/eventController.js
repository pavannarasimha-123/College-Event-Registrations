const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// Helper to find an event by ObjectId or custom eventId
const findEventByIdOrCustomId = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const event = await Event.findById(id);
    if (event) return event;
  }
  return await Event.findOne({ eventId: id });
};

// @desc    Get all events with registered count and seat availability
// @route   GET /api/events
// @access  Public
const getAllEvents = async (req, res, next) => {
  try {
    // We aggregate events and join with registrations to get accurate live counts
    const events = await Event.aggregate([
      {
        $lookup: {
          from: 'registrations',
          let: { eId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$eventId', '$$eId'] },
                    { $eq: ['$participationStatus', 'Registered'] }
                  ]
                }
              }
            }
          ],
          as: 'registrationsList'
        }
      },
      {
        $addFields: {
          registeredCount: { $size: '$registrationsList' },
          availableSeats: {
            $max: [
              0,
              { $subtract: ['$maximumParticipants', { $size: '$registrationsList' }] }
            ]
          },
          isFull: {
            $gte: [{ $size: '$registrationsList' }, '$maximumParticipants']
          }
        }
      },
      {
        $project: {
          registrationsList: 0 // omit the raw registration array to keep payload lightweight
        }
      },
      {
        $sort: { eventDate: 1 }
      }
    ]);

    res.status(200).json({
      count: events.length,
      events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID with seat availability
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await findEventByIdOrCustomId(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const registeredCount = await Registration.countDocuments({
      eventId: event._id,
      participationStatus: 'Registered'
    });

    const availableSeats = Math.max(0, event.maximumParticipants - registeredCount);
    const isFull = registeredCount >= event.maximumParticipants;

    res.status(200).json({
      event: {
        ...event.toObject(),
        registeredCount,
        availableSeats,
        isFull
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin only)
const createEvent = async (req, res, next) => {
  try {
    const {
      eventTitle,
      category,
      eventDate,
      venue,
      organizer,
      maximumParticipants
    } = req.body;

    // Validation
    if (!eventTitle || !eventTitle.trim()) {
      return res.status(400).json({ message: 'Event Title is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Category is required.' });
    }
    if (!eventDate) {
      return res.status(400).json({ message: 'Event Date is required.' });
    }
    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Please provide a valid Event Date.' });
    }
    if (!venue || !venue.trim()) {
      return res.status(400).json({ message: 'Venue is required.' });
    }
    if (!organizer || !organizer.trim()) {
      return res.status(400).json({ message: 'Organizer is required.' });
    }
    const parsedMax = Number(maximumParticipants);
    if (!parsedMax || parsedMax < 1 || !Number.isInteger(parsedMax)) {
      return res.status(400).json({ message: 'Maximum participants must be a positive integer.' });
    }

    const newEvent = new Event({
      eventTitle: eventTitle.trim(),
      category: category.trim(),
      eventDate: parsedDate,
      venue: venue.trim(),
      organizer: organizer.trim(),
      maximumParticipants: parsedMax
    });

    await newEvent.save();

    res.status(201).json({
      message: 'Event created successfully.',
      event: newEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing event
// @route   PUT /api/events/:id
// @access  Private (Admin only)
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await findEventByIdOrCustomId(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const {
      eventTitle,
      category,
      eventDate,
      venue,
      organizer,
      maximumParticipants
    } = req.body;

    if (eventTitle !== undefined) {
      if (!eventTitle.trim()) return res.status(400).json({ message: 'Event Title cannot be empty.' });
      event.eventTitle = eventTitle.trim();
    }
    if (category !== undefined) {
      if (!category.trim()) return res.status(400).json({ message: 'Category cannot be empty.' });
      event.category = category.trim();
    }
    if (eventDate !== undefined) {
      const parsedDate = new Date(eventDate);
      if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: 'Please provide a valid date.' });
      event.eventDate = parsedDate;
    }
    if (venue !== undefined) {
      if (!venue.trim()) return res.status(400).json({ message: 'Venue cannot be empty.' });
      event.venue = venue.trim();
    }
    if (organizer !== undefined) {
      if (!organizer.trim()) return res.status(400).json({ message: 'Organizer cannot be empty.' });
      event.organizer = organizer.trim();
    }
    if (maximumParticipants !== undefined) {
      const parsedMax = Number(maximumParticipants);
      if (!parsedMax || parsedMax < 1 || !Number.isInteger(parsedMax)) {
        return res.status(400).json({ message: 'Maximum participants must be a positive integer.' });
      }
      event.maximumParticipants = parsedMax;
    }

    await event.save();

    res.status(200).json({
      message: 'Event updated successfully.',
      event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event and cascade delete its associated registrations
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await findEventByIdOrCustomId(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // CASCADE DELETION EXPLANATION:
    // To prevent orphan records in the registrations collection, when an event is deleted
    // by the admin, all associated registrations referencing this event are also deleted.
    const deletedRegistrations = await Registration.deleteMany({ eventId: event._id });

    // Delete the event document
    await Event.findByIdAndDelete(event._id);

    res.status(200).json({
      message: 'Event and associated registrations deleted successfully.',
      deletedEventId: event.eventId,
      removedRegistrationsCount: deletedRegistrations.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get real-time admin statistics for dashboard
// @route   GET /api/events/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res, next) => {
  try {
    const now = new Date();

    const [totalEvents, totalRegistrations, upcomingEvents] = await Promise.all([
      Event.countDocuments(),
      Registration.countDocuments({ participationStatus: 'Registered' }),
      Event.countDocuments({ eventDate: { $gte: now } })
    ]);

    res.status(200).json({
      totalEvents,
      totalRegistrations,
      upcomingEvents
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getAdminStats
};
