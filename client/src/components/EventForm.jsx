import React, { useState, useEffect } from 'react';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'];

const EventForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
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

  return (
    <form onSubmit={handleSubmit} className="event-form">
      {formError && <div className="form-alert error">{formError}</div>}

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
            value={formData.eventDate}
            onChange={handleChange}
            required
          />
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
