const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getAdminStats
} = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Public routes for viewing events
router.get('/', getAllEvents);

// Admin dashboard statistics (must be placed before /:id to avoid collision)
router.get('/admin/stats', authenticateToken, requireAdmin, getAdminStats);

// Single event details
router.get('/:id', getEventById);

// Admin CRUD routes
router.post('/', authenticateToken, requireAdmin, createEvent);
router.put('/:id', authenticateToken, requireAdmin, updateEvent);
router.delete('/:id', authenticateToken, requireAdmin, deleteEvent);

module.exports = router;
