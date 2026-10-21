import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { registrationService } from '../services/registrationService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const MyRegistrations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter') || 'all';

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

  const now = new Date();

  // Helper to determine if an event is in the past
  const isEventPast = (reg) => {
    if (!reg.eventId || !reg.eventId.eventDate) return false;
    const eventDate = new Date(reg.eventId.eventDate);
    const endOfEventDay = new Date(eventDate);
    endOfEventDay.setHours(23, 59, 59, 999);
    return endOfEventDay < now;
  };

  // Count stats
  const upcomingCount = registrations.filter((r) => !isEventPast(r)).length;
  const pastCount = registrations.filter((r) => isEventPast(r)).length;

  // Filter list according to active tab
  const displayedRegistrations = registrations.filter((reg) => {
    if (filterParam === 'upcoming') {
      return !isEventPast(reg);
    }
    if (filterParam === 'past') {
      return isEventPast(reg);
    }
    return true; // 'all'
  });

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

      {/* Filter Tabs */}
      <div className="filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="category-pills">
          <button
            className={`pill-btn ${filterParam === 'all' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'all' })}
          >
            All Registrations ({registrations.length})
          </button>
          <button
            className={`pill-btn ${filterParam === 'upcoming' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'upcoming' })}
          >
            Upcoming Events ({upcomingCount})
          </button>
          <button
            className={`pill-btn ${filterParam === 'past' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'past' })}
          >
            Past / Completed ({pastCount})
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading your registrations..." />
      ) : displayedRegistrations.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon">🎟️</span>
          <h3>
            {filterParam === 'upcoming'
              ? 'No Upcoming Registrations'
              : filterParam === 'past'
              ? 'No Past Event History'
              : 'No Active Registrations'}
          </h3>
          <p>
            {filterParam === 'upcoming'
              ? 'You do not have any upcoming registered events scheduled right now.'
              : filterParam === 'past'
              ? 'You have not attended any completed events yet.'
              : "You haven't registered for any college events yet."}
          </p>
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
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedRegistrations.map((reg) => {
                  const event = reg.eventId;
                  const regId = reg._id || reg.registrationId;
                  const isPast = isEventPast(reg);

                  const eventDateStr = event?.eventDate
                    ? new Date(event.eventDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <tr key={regId} style={isPast ? { backgroundColor: '#fafbfc' } : {}}>
                      <td>
                        <div className="event-title-cell">
                          <span className="font-semibold">{event?.eventTitle || 'Deleted Event'}</span>
                          <span className="text-muted text-xs">ID: {event?.eventId || reg.eventId}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge sm">{event?.category || 'General'}</span>
                      </td>
                      <td>
                        {eventDateStr}
                        {isPast && (
                          <span 
                            style={{ 
                              display: 'block', 
                              fontSize: '0.72rem', 
                              color: '#64748b', 
                              fontWeight: 500 
                            }}
                          >
                            (Completed)
                          </span>
                        )}
                      </td>
                      <td>{event?.venue || 'N/A'}</td>
                      <td>
                        {isPast ? (
                          <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                            Concluded
                          </span>
                        ) : (
                          <span className="status-badge registered">{reg.participationStatus}</span>
                        )}
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
                        {!isPast ? (
                          <button
                            onClick={() => handleCancel(regId, event?.eventTitle || 'Event')}
                            disabled={cancellingId === regId}
                            className="btn btn-danger btn-xs"
                            title="Cancel Registration"
                          >
                            {cancellingId === regId ? 'Cancelling...' : 'Cancel Registration'}
                          </button>
                        ) : (
                          <span 
                            style={{ 
                              fontSize: '0.75rem', 
                              color: '#94a3b8', 
                              fontStyle: 'italic',
                              padding: '4px 6px' 
                            }}
                          >
                            Past Event
                          </span>
                        )}
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
