import React, { useState, useEffect } from 'react';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'];

// Helper to get local date string formatted as YYYY-MM-DD
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EventForm = ({ initialData, onSubmit, onCancel, isSubmitting, serverError }) => {
  const todayStr = getTodayDateString();

  const [formData, setFormData] = useState({
    eventTitle: '',
    category: 'Technical',
    eventDate: '',
    venue: '',
    organizer: '',
    maximumParticipants: 50
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      // Format date for date input (YYYY-MM-DD)
      let formattedDate = '';
      if (initialData.eventDate) {
        const d = new Date(initialData.eventDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split('T')[0];
        }
      }

      setFormData({
        eventTitle: initialData.eventTitle || '',
        category: initialData.category || 'Technical',
        eventDate: formattedDate,
        venue: initialData.venue || '',
        organizer: initialData.organizer || '',
        maximumParticipants: initialData.maximumParticipants || 50
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maximumParticipants' ? (value === '' ? '' : parseInt(value, 10)) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formData.eventTitle.trim()) {
      return setFormError('Event Title is required.');
    }
    if (!formData.category.trim()) {
      return setFormError('Category is required.');
    }
    if (!formData.eventDate) {
      return setFormError('Event Date is required.');
    }

    // Bug Fix: Prevent past date selection
    const isCreating = !initialData;
    const initialFormattedDate = initialData?.eventDate
      ? new Date(initialData.eventDate).toISOString().split('T')[0]
      : '';
    const isDateChanged = initialData && formData.eventDate !== initialFormattedDate;

    if ((isCreating || isDateChanged) && formData.eventDate < todayStr) {
      return setFormError('Event Date cannot be in the past. Please select today or a future date.');
    }

    if (!formData.venue.trim()) {
      return setFormError('Venue is required.');
    }
    if (!formData.organizer.trim()) {
      return setFormError('Organizer is required.');
    }
    if (!formData.maximumParticipants || formData.maximumParticipants < 1) {
      return setFormError('Maximum Participants must be at least 1.');
    }

    onSubmit(formData);
  };

  const initialFormattedDate = initialData?.eventDate
    ? new Date(initialData.eventDate).toISOString().split('T')[0]
    : '';

  // Min date allowed in the HTML date picker:
  // For new events: today
  // For existing events: if it was in the past, allow initial date so form doesn't block loading, otherwise today
  const minDate = initialData && initialFormattedDate && initialFormattedDate < todayStr
    ? initialFormattedDate
    : todayStr;

  const displayError = formError || serverError;

  return (
    <form onSubmit={handleSubmit} className="event-form">
      {displayError && <div className="form-alert error">{displayError}</div>}

      <div className="form-group">
        <label htmlFor="eventTitle">Event Title *</label>
        <input
          type="text"
          id="eventTitle"
          name="eventTitle"
          value={formData.eventTitle}
          onChange={handleChange}
          placeholder="e.g. Annual AI & ML Hackathon"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group flex-1">
          <label htmlFor="eventDate">Event Date *</label>
          <input
            type="date"
            id="eventDate"
            name="eventDate"
            min={minDate}
            value={formData.eventDate}
            onChange={handleChange}
            required
          />
          <small style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Events cannot be scheduled in the past (Min: {todayStr})
          </small>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label htmlFor="venue">Venue *</label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            placeholder="e.g. Main Auditorium / Lab 3"
            required
          />
        </div>

        <div className="form-group flex-1">
          <label htmlFor="maximumParticipants">Maximum Participants *</label>
          <input
            type="number"
            id="maximumParticipants"
            name="maximumParticipants"
            min="1"
            value={formData.maximumParticipants}
            onChange={handleChange}
            placeholder="e.g. 50"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="organizer">Organizer *</label>
        <input
          type="text"
          id="organizer"
          name="organizer"
          value={formData.organizer}
          onChange={handleChange}
          placeholder="e.g. Department of Computer Science"
          required
        />
      </div>

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving Event...' : initialData ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
