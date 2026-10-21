import React, { useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Upcoming', 'Past'
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventService.getAllEvents();
      setEvents(data.events || []);
      setFilteredEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.message || 'Failed to load college events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let result = [...events];
    const now = new Date();

    // Filter by Status (Upcoming / Past / All)
    if (statusFilter === 'Upcoming') {
      result = result.filter((e) => {
        const d = new Date(e.eventDate);
        d.setHours(23, 59, 59, 999);
        return d >= now;
      });
    } else if (statusFilter === 'Past') {
      result = result.filter((e) => {
        const d = new Date(e.eventDate);
        d.setHours(23, 59, 59, 999);
        return d < now;
      });
    }

    // Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter((event) => event.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (event) =>
          event.eventTitle.toLowerCase().includes(term) ||
          event.organizer.toLowerCase().includes(term) ||
          event.venue.toLowerCase().includes(term)
      );
    }

    // Sort: upcoming events first (earliest upcoming date first), past events last
    result.sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);
      const isPastA = new Date(a.eventDate).setHours(23, 59, 59, 999) < now.getTime();
      const isPastB = new Date(b.eventDate).setHours(23, 59, 59, 999) < now.getTime();

      if (isPastA && !isPastB) return 1;
      if (!isPastA && isPastB) return -1;
      return dateA - dateB;
    });

    setFilteredEvents(result);
  }, [selectedCategory, statusFilter, searchTerm, events]);

  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar'];

  const now = new Date();
  const upcomingTotal = events.filter((e) => {
    const d = new Date(e.eventDate);
    d.setHours(23, 59, 59, 999);
    return d >= now;
  }).length;
  const pastTotal = events.length - upcomingTotal;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campus Events</h1>
          <p className="page-subtitle">
            Browse and register for upcoming hackathons, sports, cultural fests, and workshops.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by event title, organizer or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        {/* Status Toggle (Upcoming / All / Past) */}
        <div className="category-pills" style={{ marginBottom: '0.5rem' }}>
          <button
            className={`pill-btn ${statusFilter === 'All' ? 'active' : ''}`}
            onClick={() => setStatusFilter('All')}
          >
            All Events ({events.length})
          </button>
          <button
            className={`pill-btn ${statusFilter === 'Upcoming' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Upcoming')}
          >
            Upcoming Only ({upcomingTotal})
          </button>
          <button
            className={`pill-btn ${statusFilter === 'Past' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Past')}
          >
            Past Events ({pastTotal})
          </button>
        </div>

        {/* Category Pills */}
        <div className="category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && <ErrorMessage message={error} onRetry={fetchEvents} />}

      {/* Loading state */}
      {loading ? (
        <LoadingSpinner message="Loading events..." />
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon">🔎</span>
          <h3>No Events Found</h3>
          <p>
            {searchTerm || selectedCategory !== 'All' || statusFilter !== 'All'
              ? 'No events match your current filter criteria.'
              : 'There are currently no events posted. Please check back later!'}
          </p>
          {(searchTerm || selectedCategory !== 'All' || statusFilter !== 'All') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedCategory('All');
                setStatusFilter('All');
                setSearchTerm('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="event-grid">
          {filteredEvents.map((event) => (
            <EventCard key={event._id || event.eventId} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
