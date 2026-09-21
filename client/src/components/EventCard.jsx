import React from 'react';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  const eventId = event._id || event.eventId;
  
  // Format Date cleanly
  const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const availableSeats = event.availableSeats !== undefined 
    ? event.availableSeats 
    : Math.max(0, event.maximumParticipants - (event.registeredCount || 0));
  
  const isFull = event.isFull !== undefined 
    ? event.isFull 
    : availableSeats <= 0;

  return (
    <div className="event-card">
      <div className="event-card-header">
        <span className="category-badge">{event.category}</span>
        {isFull ? (
          <span className="capacity-badge full">Full</span>
        ) : (
          <span className="capacity-badge open">{availableSeats} seats left</span>
        )}
      </div>

      <h3 className="event-title">{event.eventTitle}</h3>

      <div className="event-meta-list">
        <div className="meta-row">
          <span className="meta-icon">📅</span>
          <span>{formattedDate}</span>
        </div>
        <div className="meta-row">
          <span className="meta-icon">📍</span>
          <span>{event.venue}</span>
        </div>
        <div className="meta-row">
          <span className="meta-icon">🏢</span>
          <span>{event.organizer}</span>
        </div>
        <div className="meta-row">
          <span className="meta-icon">👥</span>
          <span>
            Capacity: <strong>{event.maximumParticipants}</strong> &bull; Available: <strong>{availableSeats}</strong>
          </span>
        </div>
      </div>

      <div className="event-card-footer">
        <Link to={`/events/${eventId}`} className="btn btn-primary btn-block">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default EventCard;
