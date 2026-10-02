import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsData, eventsData] = await Promise.all([
        eventService.getAdminStats(),
        eventService.getAllEvents()
      ]);

      setStats({
        totalEvents: statsData.totalEvents || 0,
        totalRegistrations: statsData.totalRegistrations || 0,
        upcomingEvents: statsData.upcomingEvents || 0
      });

      setRecentEvents((eventsData.events || []).slice(0, 5));
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to fetch admin statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Admin Header */}
      <div className="dashboard-welcome-banner admin-banner">
        <div>
          <span className="badge-tag admin">Administrator Portal</span>
          <h1 className="welcome-heading">College Events Overview</h1>
          <p className="welcome-subtext">
            Monitor registration trends, manage upcoming college events, and inspect student participation reports.
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/admin/events" className="btn btn-primary">
            Manage Events
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchDashboardData} />}

      {/* Real-time Metrics from MongoDB */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">📅</div>
          <div className="stat-info">
            <span className="stat-label">Total Events</span>
            <h3 className="stat-value">{loading ? '...' : stats.totalEvents}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">👥</div>
          <div className="stat-info">
            <span className="stat-label">Total Registrations</span>
            <h3 className="stat-value">{loading ? '...' : stats.totalRegistrations}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">⏳</div>
          <div className="stat-info">
            <span className="stat-label">Upcoming Events</span>
            <h3 className="stat-value">{loading ? '...' : stats.upcomingEvents}</h3>
          </div>
        </div>
      </div>

      {/* Recent Events & Participant Access */}
      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Recent Event Activities</h2>
            <p className="section-subtitle">Real-time status of scheduled college events</p>
          </div>
          <Link to="/admin/events" className="btn btn-outline btn-sm">
            Go to Event Manager &rarr;
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Calculating real-time database stats..." />
        ) : recentEvents.length === 0 ? (
          <div className="empty-state-card">
            <span className="empty-icon">📂</span>
            <h3>No Events Created Yet</h3>
            <p>Get started by creating the first college event.</p>
            <Link to="/admin/events" className="btn btn-primary btn-sm">
              Create Event
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
                  <th>Capacity</th>
                  <th>Registrations</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((evt) => {
                  const id = evt._id || evt.eventId;
                  const regCount = evt.registeredCount || 0;
                  const isFull = regCount >= evt.maximumParticipants;

                  return (
                    <tr key={id}>
                      <td className="font-semibold">{evt.eventTitle}</td>
                      <td>
                        <span className="category-badge sm">{evt.category}</span>
                      </td>
                      <td>
                        {new Date(evt.eventDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td>{evt.maximumParticipants} seats</td>
                      <td>
                        <span className={`capacity-indicator ${isFull ? 'full' : 'normal'}`}>
                          {regCount} / {evt.maximumParticipants} {isFull && '(Full)'}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/admin/events?viewParticipants=${id}`}
                          className="btn btn-outline btn-xs"
                        >
                          View Participants
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
