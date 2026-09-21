const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Event = require('../models/Event');

const sampleEvents = [
  {
    eventTitle: 'AI & Machine Learning Workshop',
    category: 'Workshop',
    eventDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
    venue: 'Seminar Hall 1, Block B',
    organizer: 'Computer Science Department',
    maximumParticipants: 40
  },
  {
    eventTitle: 'Annual Inter-College Hackathon 2026',
    category: 'Technical',
    eventDate: new Date(Date.now() + 86400000 * 12), // 12 days from now
    venue: 'Innovation & Incubation Hub',
    organizer: 'IEEE Student Chapter',
    maximumParticipants: 60
  },
  {
    eventTitle: 'Spring Cultural Fest - Tarang',
    category: 'Cultural',
    eventDate: new Date(Date.now() + 86400000 * 18), // 18 days from now
    venue: 'Open Air Amphitheatre',
    organizer: 'Cultural Affairs Committee',
    maximumParticipants: 150
  },
  {
    eventTitle: 'Inter-Department Cricket Tournament',
    category: 'Sports',
    eventDate: new Date(Date.now() + 86400000 * 22), // 22 days from now
    venue: 'University Sports Complex Ground',
    organizer: 'Department of Physical Education',
    maximumParticipants: 32
  },
  {
    eventTitle: 'Web3 & Cloud Computing Seminar',
    category: 'Seminar',
    eventDate: new Date(Date.now() + 86400000 * 28), // 28 days from now
    venue: 'Auditorium 2',
    organizer: 'Information Technology Society',
    maximumParticipants: 50
  }
];

const seedEvents = async () => {
  try {
    console.log('[Seed Events] Connecting to database...');
    await connectDB();

    console.log('[Seed Events] Checking existing events...');
    const count = await Event.countDocuments();
    if (count === 0) {
      await Event.insertMany(sampleEvents);
      console.log(`[Seed Events] Successfully seeded ${sampleEvents.length} initial college events!`);
    } else {
      console.log(`[Seed Events] Database already contains ${count} events. Skipping duplicate seeding.`);
    }

    await mongoose.connection.close();
    console.log('[Seed Events] Done.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Events Error]', err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedEvents();
