import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registrationService } from '../services/registrationService';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        const data = await registrationService.getMyRegistrations();
        setRegistrations(data.registrations || []);
      } catch (err) {
        console.error('Failed to load student registrations:', err);
        setError('Unable to load registration statistics at this moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  const now = new Date();
  
  // Filter ONLY upcoming events (scheduled for today or in the future)
  const upcomingRegistered = registrations.filter((reg) => {
    if (!reg.eventId || !reg.eventId.eventDate) return false;
    const eventDate = new Date(reg.eventId.eventDate);
    const endOfEventDay = new Date(eventDate);
    endOfEventDay.setHours(23, 59, 59, 999);
    return endOfEventDay >= now;
  });

  const completedCount = registrations.length - upcomingRegistered.length;

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner">
        <div>
          <span className="badge-tag">Student Portal</span>
          <h1 className="welcome-heading">Welcome, {user?.name || 'Student'}!</h1>
          <p className="welcome-subtext">
            Track your registered events, explore upcoming college activities, and manage your participation.
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/events" className="btn btn-primary">
            Browse Events
          </Link>
          <Link to="/student/my-registrations" className="btn btn-secondary">
            My Registrations
          </Link>
        </div>
      </div>

      {error && <div className="form-alert error">{error}</div>}

      {/* Metrics Row - Interactive Clickable Cards */}
      <div className="stats-grid">
        <Link 
          to="/student/my-registrations?filter=all" 
          className="stat-card stat-card-link"
          title="Click to view all your registered events"
        >
          <div className="stat-icon-wrapper blue">🎫</div>
          <div className="stat-info">
            <span className="stat-label">Total Registrations</span>
            <h3 className="stat-value">{loading ? '...' : registrations.length}</h3>
            <span className="stat-card-hint">View all registrations &rarr;</span>
          </div>
          <div className="stat-card-arrow">&rarr;</div>
        </Link>

        <Link 
          to="/student/my-registrations?filter=upcoming" 
          className="stat-card stat-card-link"
          title="Click to view your upcoming registered events"
        >
          <div className="stat-icon-wrapper green">⏳</div>
          <div className="stat-info">
            <span className="stat-label">Upcoming Events</span>
            <h3 className="stat-value">{loading ? '...' : upcomingRegistered.length}</h3>
            <span className="stat-card-hint">View schedule &rarr;</span>
          </div>
          <div className="stat-card-arrow">&rarr;</div>
        </Link>

        <Link 
          to="/student/my-registrations?filter=past" 
          className="stat-card stat-card-link"
          title="Click to view your completed event history"
        >
          <div className="stat-icon-wrapper gray">🏁</div>
          <div className="stat-info">
            <span className="stat-label">Past / Completed</span>
            <h3 className="stat-value">{loading ? '...' : completedCount}</h3>
            <span className="stat-card-hint">View history &rarr;</span>
          </div>
          <div className="stat-card-arrow">&rarr;</div>
        </Link>
      </div>

      {/* Upcoming Registered Events Section - STRICTLY UPCOMING ONLY */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Upcoming Registered Events</h2>
            <p className="section-subtitle">Future events you are registered to participate in</p>
          </div>
          <Link to="/student/my-registrations?filter=upcoming" className="btn btn-outline btn-sm">
            View All Upcoming ({upcomingRegistered.length})
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your schedule..." />
        ) : upcomingRegistered.length === 0 ? (
          <div className="empty-state-card">
            <span className="empty-icon">📅</span>
            <h3>No Upcoming Events</h3>
            <p>You currently have no registered upcoming events. Browse campus events to join!</p>
            <Link to="/events" className="btn btn-primary btn-sm">
              Explore Available Events
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {upcomingRegistered.map((reg) => (
                  <tr key={reg._id || reg.registrationId}>
                    <td className="font-semibold">{reg.eventId?.eventTitle}</td>
                    <td>
                      <span className="category-badge sm">{reg.eventId?.category}</span>
                    </td>
                    <td>
                      {new Date(reg.eventId?.eventDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td>{reg.eventId?.venue}</td>
                    <td>
                      <span className="status-badge registered">{reg.participationStatus}</span>
                    </td>
                    <td>
                      <Link
                        to={`/events/${reg.eventId?._id || reg.eventId?.eventId}`}
                        className="btn btn-outline btn-xs"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
