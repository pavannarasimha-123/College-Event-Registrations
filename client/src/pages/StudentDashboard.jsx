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
  const upcomingRegistered = registrations.filter((reg) => {
    return reg.eventId && new Date(reg.eventId.eventDate) >= now;
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

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">🎫</div>
          <div className="stat-info">
            <span className="stat-label">Total Registrations</span>
            <h3 className="stat-value">{loading ? '...' : registrations.length}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">⏳</div>
          <div className="stat-info">
            <span className="stat-label">Upcoming Events</span>
            <h3 className="stat-value">{loading ? '...' : upcomingRegistered.length}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper gray">🏁</div>
          <div className="stat-info">
            <span className="stat-label">Past / Completed</span>
            <h3 className="stat-value">{loading ? '...' : completedCount}</h3>
          </div>
        </div>
      </div>

      {/* Upcoming Registered Events Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Upcoming Registered Events</h2>
            <p className="section-subtitle">Events you are scheduled to participate in</p>
          </div>
          <Link to="/student/my-registrations" className="btn btn-outline btn-sm">
            View All ({registrations.length})
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your schedule..." />
        ) : upcomingRegistered.length === 0 ? (
          <div className="empty-state-card">
            <span className="empty-icon">📅</span>
            <h3>No Upcoming Events</h3>
            <p>You have not registered for any upcoming events yet.</p>
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
                {upcomingRegistered.slice(0, 5).map((reg) => (
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
