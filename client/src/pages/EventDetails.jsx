import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { registrationService } from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isStudent, isAdmin } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventService.getEventById(id);
      setEvent(data.event);

      // If user is a student, check whether they have already registered
      if (isAuthenticated && isStudent) {
        try {
          const myRegs = await registrationService.getMyRegistrations();
          const matched = (myRegs.registrations || []).some(
            (r) => (r.eventId?._id === data.event._id || r.eventId?.eventId === data.event.eventId)
          );
          setIsAlreadyRegistered(matched);
        } catch (regErr) {
          console.warn('Could not verify existing registration status:', regErr);
        }
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err.response?.data?.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id, isAuthenticated, isStudent]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    if (!isStudent) {
      setActionMessage({
        type: 'error',
        text: 'Admins cannot register as event participants.'
      });
      return;
    }

    try {
      setRegistering(true);
      setActionMessage({ type: '', text: '' });

      const res = await registrationService.registerEvent(event._id || event.eventId);
      setActionMessage({
        type: 'success',
        text: 'Registration successful! You have secured a seat for this event.'
      });
      setIsAlreadyRegistered(true);

      // Refresh event capacity data
      const updatedData = await eventService.getEventById(id);
      setEvent(updatedData.event);
    } catch (err) {
      console.error('Registration failed:', err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || '';

      if (status === 409 || msg.toLowerCase().includes('already registered')) {
        setActionMessage({
          type: 'warning',
          text: 'You are already registered for this event.'
        });
        setIsAlreadyRegistered(true);
      } else if (status === 400 && msg.toLowerCase().includes('full')) {
        setActionMessage({
          type: 'error',
          text: 'This event is full. Maximum participant capacity reached.'
        });
      } else {
        setActionMessage({
          type: 'error',
          text: msg || 'Registration could not be completed. Please try again.'
        });
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading event details..." />;
  }

  if (error || !event) {
    return (
      <div className="page-container">
        <ErrorMessage message={error || 'Event not found.'} onRetry={fetchEventData} />
        <Link to="/events" className="btn btn-secondary mt-4">
          &larr; Back to Events
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const availableSeats = event.availableSeats !== undefined
    ? event.availableSeats
    : Math.max(0, event.maximumParticipants - (event.registeredCount || 0));

  const isFull = event.isFull !== undefined ? event.isFull : availableSeats <= 0;

  return (
    <div className="page-container">
      <div className="breadcrumb-nav">
        <Link to="/events" className="breadcrumb-link">&larr; Back to Events List</Link>
      </div>

      <div className="event-details-layout">
        <div className="event-main-card">
          <div className="event-detail-header">
            <div className="badge-row">
              <span className="category-badge">{event.category}</span>
              {isFull ? (
                <span className="capacity-badge full">Event Full</span>
              ) : (
                <span className="capacity-badge open">{availableSeats} Seats Available</span>
              )}
            </div>
            <h1 className="event-detail-title">{event.eventTitle}</h1>
            <p className="event-detail-id">Event ID: <code>{event.eventId}</code></p>
          </div>

          {actionMessage.text && (
            <div className={`form-alert ${actionMessage.type}`}>
              {actionMessage.type === 'success' && '✅ '}
              {actionMessage.type === 'warning' && 'ℹ️ '}
              {actionMessage.type === 'error' && '⚠️ '}
              {actionMessage.text}
            </div>
          )}

          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Date & Time</span>
              <div className="detail-value">
                <span className="icon">📅</span>
                <span>{formattedDate}</span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Venue</span>
              <div className="detail-value">
                <span className="icon">📍</span>
                <span>{event.venue}</span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Organized By</span>
              <div className="detail-value">
                <span className="icon">🏢</span>
                <span>{event.organizer}</span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Category</span>
              <div className="detail-value">
                <span className="icon">🏷️</span>
                <span>{event.category}</span>
              </div>
            </div>
          </div>

          <div className="capacity-breakdown-card">
            <h3 className="breakdown-title">Capacity & Availability</h3>
            <div className="breakdown-stats">
              <div className="breakdown-stat">
                <span className="num">{event.maximumParticipants}</span>
                <span className="lbl">Maximum Capacity</span>
              </div>
              <div className="breakdown-stat">
                <span className="num">{event.registeredCount || 0}</span>
                <span className="lbl">Registered</span>
              </div>
              <div className="breakdown-stat">
                <span className={`num ${availableSeats === 0 ? 'text-danger' : 'text-success'}`}>
                  {availableSeats}
                </span>
                <span className="lbl">Seats Available</span>
              </div>
            </div>

            {/* Visual Capacity Bar */}
            <div className="capacity-bar-wrapper">
              <div
                className={`capacity-bar-fill ${isFull ? 'full' : ''}`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(((event.registeredCount || 0) / event.maximumParticipants) * 100)
                  )}%`
                }}
              ></div>
            </div>
          </div>

          {/* Registration Action Section */}
          <div className="registration-action-box">
            {!isAuthenticated ? (
              <div className="unauth-box">
                <p>You must be signed in with a Student account to register for this event.</p>
                <Link
                  to="/login"
                  state={{ from: { pathname: `/events/${id}` } }}
                  className="btn btn-primary btn-md"
                >
                  Login to Register
                </Link>
              </div>
            ) : isAdmin ? (
              <div className="admin-notice-box">
                <p>🛡️ You are logged in as an Administrator.</p>
                <div className="mt-2">
                  <Link to="/admin/events" className="btn btn-secondary btn-sm">
                    Manage Events & View Participants
                  </Link>
                </div>
              </div>
            ) : isAlreadyRegistered ? (
              <div className="registered-notice-box">
                <div className="registered-info">
                  <span className="check-icon">✓</span>
                  <div>
                    <h4>You are registered for this event!</h4>
                    <p>Your seat has been reserved. You can view or manage it in My Registrations.</p>
                  </div>
                </div>
                <Link to="/student/my-registrations" className="btn btn-outline btn-sm">
                  Go to My Registrations
                </Link>
              </div>
            ) : isFull ? (
              <div className="full-notice-box">
                <h4>Registration Closed</h4>
                <p>This event has reached its maximum capacity of {event.maximumParticipants} participants.</p>
                <button className="btn btn-secondary" disabled>
                  Event is Full
                </button>
              </div>
            ) : (
              <div className="open-register-box">
                <div className="open-info">
                  <h4>Ready to participate?</h4>
                  <p>Secure your registration spot before all seats are filled.</p>
                </div>
                <button
                  onClick={handleRegister}
                  className="btn btn-primary btn-lg"
                  disabled={registering}
                >
                  {registering ? 'Processing Registration...' : 'Register for Event'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
