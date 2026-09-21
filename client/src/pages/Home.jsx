import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const { isAuthenticated, isStudent, isAdmin } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        const data = await eventService.getAllEvents();
        // Sort and take top 3 upcoming events
        const now = new Date();
        const events = (data.events || [])
          .filter((e) => new Date(e.eventDate) >= now)
          .slice(0, 3);
        setUpcomingEvents(events);
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
        setError('Could not load upcoming events.');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">Campus Activities Hub</span>
          <h1 className="hero-title">College Event Registration Portal</h1>
          <p className="hero-subtitle">
            Register for technical, cultural, sports and workshop events organized by the college.
          </p>
          <div className="hero-actions">
            {!isAuthenticated ? (
              <>
                <Link to="/events" className="btn btn-primary btn-lg">
                  View Events
                </Link>
                <Link to="/register" className="btn btn-secondary btn-lg">
                  Register Now
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Login
                </Link>
              </>
            ) : isStudent ? (
              <>
                <Link to="/events" className="btn btn-primary btn-lg">
                  Browse Events
                </Link>
                <Link to="/student/dashboard" className="btn btn-secondary btn-lg">
                  Student Dashboard
                </Link>
                <Link to="/student/my-registrations" className="btn btn-outline btn-lg">
                  My Registrations
                </Link>
              </>
            ) : (
              <>
                <Link to="/admin/dashboard" className="btn btn-primary btn-lg">
                  Admin Dashboard
                </Link>
                <Link to="/admin/events" className="btn btn-secondary btn-lg">
                  Manage Events
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Highlights / Features Banner */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-box">
            <span className="feature-icon">💻</span>
            <h4>Technical Hackathons</h4>
            <p>Coding challenges, hackathons, and hands-on technology workshops.</p>
          </div>
          <div className="feature-box">
            <span className="feature-icon">🎨</span>
            <h4>Cultural Fests</h4>
            <p>Music, art, dance, drama, and campus talent showcases.</p>
          </div>
          <div className="feature-box">
            <span className="feature-icon">🏆</span>
            <h4>Sports Tournaments</h4>
            <p>Inter-departmental cricket, football, basketball, and athletic meets.</p>
          </div>
          <div className="feature-box">
            <span className="feature-icon">📜</span>
            <h4>Seminars & Workshops</h4>
            <p>Industry keynotes, research talks, and skill-building bootcamps.</p>
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section className="upcoming-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Upcoming Events</h2>
            <p className="section-subtitle">Discover what's happening next across the campus</p>
          </div>
          <Link to="/events" className="btn btn-outline btn-sm">
            View All Events &rarr;
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading upcoming events..." />
        ) : error ? (
          <div className="info-box error">{error}</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="empty-state-box">
            <p>No upcoming events scheduled right now. Check back soon!</p>
          </div>
        ) : (
          <div className="event-grid">
            {upcomingEvents.map((event) => (
              <EventCard key={event._id || event.eventId} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
