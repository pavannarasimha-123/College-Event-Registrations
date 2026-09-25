const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { generateEventTicketPDF } = require('../utils/pdfTicketGenerator');
const { sendEventRegistrationEmail } = require('../utils/emailService');

// Helper to find an event by ObjectId or custom eventId
const findEventByIdOrCustomId = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const event = await Event.findById(id);
    if (event) return event;
  }
  return await Event.findOne({ eventId: id });
};

// @desc    Register student for an event
// @route   POST /api/registrations/registerEvent
// @access  Private (Student only)
const registerEvent = async (req, res, next) => {
  try {
    const studentObjectId = req.user.id; // user._id from JWT
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required for registration.' });
    }

    // 1. Verify that the event exists
    const event = await findEventByIdOrCustomId(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // 2. Check whether the student is already registered for this event
    const existingRegistration = await Registration.findOne({
      studentId: studentObjectId,
      eventId: event._id
    });

    if (existingRegistration) {
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }

    // 3. Count existing active registrations for this event
    const registeredCount = await Registration.countDocuments({
      eventId: event._id,
      participationStatus: 'Registered'
    });

    // 4. Compare the count with maximumParticipants
    if (registeredCount >= event.maximumParticipants) {
      return res.status(400).json({ message: 'This event is full. Maximum participant capacity reached.' });
    }

    // 5. Create new Registration document
    const newRegistration = new Registration({
      studentId: studentObjectId,
      eventId: event._id,
      registrationDate: new Date(),
      participationStatus: 'Registered'
    });

    await newRegistration.save();

    // Populate event and student details for response
    await newRegistration.populate('eventId', 'eventId eventTitle category eventDate venue organizer maximumParticipants');
    await newRegistration.populate('studentId', 'userId name email');

    // Asynchronously generate PDF pass and email it to the registered student
    (async () => {
      try {
        const student = newRegistration.studentId;
        const ev = newRegistration.eventId;
        if (student && student.email) {
          const pdfBuffer = await generateEventTicketPDF(ev, student, newRegistration);
          await sendEventRegistrationEmail(student.email, student.name, ev, newRegistration, pdfBuffer);
        }
      } catch (emailErr) {
        console.error('[Registration Email Error]:', emailErr.message);
      }
    })();

    res.status(201).json({
      message: 'Successfully registered for the event! An event pass PDF has been sent to your email.',
      registration: newRegistration
    });
  } catch (error) {
    // Handle duplicate key error at MongoDB level (in case of concurrent race conditions)
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }
    next(error);
  }
};

// @desc    Get all registrations of the logged-in student
// @route   GET /api/registrations/myRegistrations
// @access  Private (Student only)
const getMyRegistrations = async (req, res, next) => {
  try {
    const studentObjectId = req.user.id;

    const registrations = await Registration.find({ studentId: studentObjectId })
      .populate({
        path: 'eventId',
        select: 'eventId eventTitle category eventDate venue organizer maximumParticipants'
      })
      .sort({ registrationDate: -1 });

    // Filter out any where event may have been nullified (though cascade deletion handles this)
    const validRegistrations = registrations.filter(reg => reg.eventId !== null);

    res.status(200).json({
      count: validRegistrations.length,
      registrations: validRegistrations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an existing registration
// @route   DELETE /api/registrations/cancelRegistration/:id
// @access  Private (Student who owns registration, or Admin)
const cancelRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;

    let registration;
    if (mongoose.Types.ObjectId.isValid(id)) {
      registration = await Registration.findById(id);
    }
    if (!registration) {
      registration = await Registration.findOne({ registrationId: id });
    }

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    // Authorization check: User must own the registration or be an admin
    if (req.user.role !== 'admin' && registration.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You cannot cancel someone else\'s registration.' });
    }

    // Delete the registration record to free up the seat
    await Registration.findByIdAndDelete(registration._id);

    res.status(200).json({
      message: 'Registration cancelled successfully.',
      registrationId: registration.registrationId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all participants registered for a specific event
// @route   GET /api/registrations/event/:eventId
// @access  Private (Admin only)
const getEventParticipants = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await findEventByIdOrCustomId(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const participants = await Registration.find({
      eventId: event._id
    })
      .populate('studentId', 'userId name email')
      .sort({ registrationDate: -1 });

    const formattedParticipants = participants.map(p => ({
      registrationId: p.registrationId,
      _id: p._id,
      studentName: p.studentId ? p.studentId.name : 'Unknown',
      studentEmail: p.studentId ? p.studentId.email : 'Unknown',
      userId: p.studentId ? p.studentId.userId : 'Unknown',
      registrationDate: p.registrationDate,
      participationStatus: p.participationStatus
    }));

    res.status(200).json({
      event: {
        _id: event._id,
        eventId: event.eventId,
        eventTitle: event.eventTitle,
        category: event.category,
        maximumParticipants: event.maximumParticipants,
        registeredCount: formattedParticipants.length
      },
      count: formattedParticipants.length,
      participants: formattedParticipants
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerEvent,
  getMyRegistrations,
  cancelRegistration,
  getEventParticipants
};
