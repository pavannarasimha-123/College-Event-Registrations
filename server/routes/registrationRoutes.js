const express = require('express');
const router = express.Router();
const {
  registerEvent,
  getMyRegistrations,
  cancelRegistration,
  getEventParticipants
} = require('../controllers/registrationController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireStudent, requireAdmin } = require('../middleware/roleMiddleware');

// Student endpoints
router.post('/registerEvent', authenticateToken, requireStudent, registerEvent);
router.get('/myRegistrations', authenticateToken, requireStudent, getMyRegistrations);

// Cancel registration endpoint (Student can cancel their own, Admin can cancel any)
router.delete('/cancelRegistration/:id', authenticateToken, cancelRegistration);

// Admin participant endpoint
router.get('/event/:eventId', authenticateToken, requireAdmin, getEventParticipants);

module.exports = router;
