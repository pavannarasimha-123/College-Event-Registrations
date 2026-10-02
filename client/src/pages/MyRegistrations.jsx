import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationService } from '../services/registrationService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await registrationService.getMyRegistrations();
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setError(err.response?.data?.message || 'Could not load your registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancel = async (id, eventTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your registration for "${eventTitle}"? Your seat will be made available to other students.`
    );
    if (!confirmed) return;

    try {
      setCancellingId(id);
      setFeedback({ type: '', message: '' });
      await registrationService.cancelRegistration(id);
      setFeedback({
        type: 'success',
        message: `Registration for "${eventTitle}" has been cancelled.`
      });
      // Remove from local list
      setRegistrations((prev) => prev.filter((r) => r._id !== id && r.registrationId !== id));
    } catch (err) {
      console.error('Cancellation failed:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to cancel registration. Please try again.'
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Registered Events</h1>
          <p className="page-subtitle">
            View your event participation status and manage your registrations.
          </p>
        </div>
        <Link to="/events" className="btn btn-primary btn-sm">
          + Explore More Events
        </Link>
      </div>

      {feedback.message && (
        <div className={`form-alert ${feedback.type}`}>
          {feedback.type === 'success' ? '✅ ' : '⚠️ '}
          {feedback.message}
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchRegistrations} />}

      {loading ? (
        <LoadingSpinner message="Loading your registrations..." />
      ) : registrations.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon">🎟️</span>
          <h3>No Active Registrations</h3>
          <p>You haven't registered for any college events yet.</p>
          <Link to="/events" className="btn btn-primary btn-md">
            Browse Campus Events
          </Link>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Event Date</th>
                  <th>Venue</th>
                  <th>Registered On</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => {
                  const event = reg.eventId;
                  const regId = reg._id || reg.registrationId;
                  const eventDateStr = event?.eventDate
                    ? new Date(event.eventDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'N/A';
                  const regDateStr = reg.registrationDate
                    ? new Date(reg.registrationDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <tr key={regId}>
                      <td>
                        <div className="event-title-cell">
                          <span className="font-semibold">{event?.eventTitle || 'Deleted Event'}</span>
                          <span className="text-muted text-xs">ID: {event?.eventId || reg.eventId}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge sm">{event?.category || 'General'}</span>
                      </td>
                      <td>{eventDateStr}</td>
                      <td>{event?.venue || 'N/A'}</td>
                      <td>{regDateStr}</td>
                      <td>
                        <span className="status-badge registered">{reg.participationStatus}</span>
                      </td>
                      <td className="text-right action-buttons-cell">
                        {event && (
                          <Link
                            to={`/events/${event._id || event.eventId}`}
                            className="btn btn-outline btn-xs"
                          >
                            Details
                          </Link>
                        )}
                        <button
                          onClick={() => handleCancel(regId, event?.eventTitle || 'Event')}
                          disabled={cancellingId === regId}
                          className="btn btn-danger btn-xs"
                          title="Cancel Registration"
                        >
                          {cancellingId === regId ? 'Cancelling...' : 'Cancel Registration'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
