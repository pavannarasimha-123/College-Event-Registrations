import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { registrationService } from '../services/registrationService';
import { generateParticipantsPDF, sortParticipants } from '../utils/pdfExport';
import EventForm from '../components/EventForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ManageEvents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionAlert, setActionAlert] = useState({ type: '', text: '' });

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Participants Modal States
  const [participantSortOrder, setParticipantSortOrder] = useState('name-asc');
  const [participantsModal, setParticipantsModal] = useState({
    isOpen: false,
    event: null,
    participants: [],
    loading: false,
    error: ''
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventService.getAllEvents();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err.response?.data?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Check URL query param for direct participant modal opening
  useEffect(() => {
    const participantEventId = searchParams.get('viewParticipants');
    if (participantEventId && events.length > 0) {
      const targetEvent = events.find(
        (e) => e._id === participantEventId || e.eventId === participantEventId
      );
      if (targetEvent) {
        handleOpenParticipants(targetEvent);
      }
    }
  }, [searchParams, events]);

  // Handle Create or Update
  const handleSaveEvent = async (formData) => {
    try {
      setIsSubmitting(true);
      setActionAlert({ type: '', text: '' });

      if (editingEvent) {
        const id = editingEvent._id || editingEvent.eventId;
        await eventService.updateEvent(id, formData);
        setActionAlert({
          type: 'success',
          text: `Event "${formData.eventTitle}" was updated successfully!`
        });
      } else {
        await eventService.createEvent(formData);
        setActionAlert({
          type: 'success',
          text: `Event "${formData.eventTitle}" was created successfully!`
        });
      }

      setIsFormModalOpen(false);
      setEditingEvent(null);
      await fetchEvents();
    } catch (err) {
      console.error('Save event failed:', err);
      setActionAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save event. Please check inputs.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteEvent = async (event) => {
    const id = event._id || event.eventId;
    const confirmed = window.confirm(
      `Are you sure you want to delete event "${event.eventTitle}"?\n\nNOTE: This will also remove all student registrations associated with this event.`
    );
    if (!confirmed) return;

    try {
      setActionAlert({ type: '', text: '' });
      await eventService.deleteEvent(id);
      setActionAlert({
        type: 'success',
        text: `Event "${event.eventTitle}" and its associated registrations were successfully deleted.`
      });
      // Remove from list
      setEvents((prev) => prev.filter((e) => e._id !== id && e.eventId !== id));
    } catch (err) {
      console.error('Delete event failed:', err);
      setActionAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete event.'
      });
    }
  };

  // Handle View Participants
  const handleOpenParticipants = async (event) => {
    const eventId = event._id || event.eventId;
    setParticipantsModal({
      isOpen: true,
      event,
      participants: [],
      loading: true,
      error: ''
    });

    try {
      const data = await registrationService.getEventParticipants(eventId);
      setParticipantsModal({
        isOpen: true,
        event: data.event || event,
        participants: data.participants || [],
        loading: false,
        error: ''
      });
    } catch (err) {
      console.error('Failed to load participants:', err);
      setParticipantsModal((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Could not load participant details.'
      }));
    }
  };

  const handleCloseParticipants = () => {
    setParticipantsModal({
      isOpen: false,
      event: null,
      participants: [],
      loading: false,
      error: ''
    });
    // Remove query param if present
    if (searchParams.get('viewParticipants')) {
      searchParams.delete('viewParticipants');
      setSearchParams(searchParams);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage College Events</h1>
          <p className="page-subtitle">
            Create new events, modify details, delete events, and review student participant lists.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setIsFormModalOpen(true);
          }}
          className="btn btn-primary btn-md"
        >
          + Create New Event
        </button>
      </div>

      {actionAlert.text && (
        <div className={`form-alert ${actionAlert.type}`}>
          {actionAlert.type === 'success' ? '✅ ' : '⚠️ '}
          {actionAlert.text}
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchEvents} />}

      {loading ? (
        <LoadingSpinner message="Loading events inventory..." />
      ) : events.length === 0 ? (
        <div className="empty-state-card">
          <span className="empty-icon">🎪</span>
          <h3>No Events Created</h3>
          <p>No college events are currently scheduled.</p>
          <button
            onClick={() => {
              setEditingEvent(null);
              setIsFormModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
          >
            Create First Event
          </button>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Event Title & Category</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Organizer</th>
                  <th>Capacity & Regs</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => {
                  const id = evt._id || evt.eventId;
                  const regCount = evt.registeredCount || 0;
                  const isFull = regCount >= evt.maximumParticipants;

                  return (
                    <tr key={id}>
                      <td>
                        <div className="event-title-cell">
                          <span className="font-semibold">{evt.eventTitle}</span>
                          <span className="category-badge sm inline-block">{evt.category}</span>
                        </div>
                      </td>
                      <td>
                        {new Date(evt.eventDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td>{evt.venue}</td>
                      <td>{evt.organizer}</td>
                      <td>
                        <span className={`capacity-indicator ${isFull ? 'full' : 'normal'}`}>
                          {regCount} / {evt.maximumParticipants}
                        </span>
                      </td>
                      <td className="text-right action-buttons-cell">
                        <button
                          onClick={() => handleOpenParticipants(evt)}
                          className="btn btn-outline btn-xs"
                          title="View Participant List"
                        >
                          Participants ({regCount})
                        </button>
                        <button
                          onClick={() => {
                            setEditingEvent(evt);
                            setIsFormModalOpen(true);
                          }}
                          className="btn btn-secondary btn-xs"
                          title="Edit Event"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt)}
                          className="btn btn-danger btn-xs"
                          title="Delete Event"
                        >
                          Delete
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

      {/* CREATE / EDIT EVENT MODAL */}
      {isFormModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingEvent ? 'Edit College Event' : 'Create New College Event'}
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setIsFormModalOpen(false);
                  setEditingEvent(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <EventForm
                initialData={editingEvent}
                onSubmit={handleSaveEvent}
                onCancel={() => {
                  setIsFormModalOpen(false);
                  setEditingEvent(null);
                }}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW PARTICIPANTS MODAL */}
      {participantsModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Registered Participants</h2>
                <p className="modal-subtitle">
                  Event: <strong>{participantsModal.event?.eventTitle}</strong> (
                  {participantsModal.participants.length} registered / Max:{' '}
                  {participantsModal.event?.maximumParticipants})
                </p>
              </div>
              <div className="modal-header-actions">
                <button
                  onClick={() =>
                    generateParticipantsPDF(
                      participantsModal.event,
                      participantsModal.participants,
                      participantSortOrder
                    )
                  }
                  className="btn btn-primary btn-sm"
                  disabled={participantsModal.participants.length === 0}
                  title="Download sorted PDF report of registered participants"
                >
                  📥 Download PDF
                </button>
                <button className="modal-close-btn" onClick={handleCloseParticipants}>
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-body">
              {participantsModal.loading ? (
                <LoadingSpinner message="Fetching participant records from database..." />
              ) : participantsModal.error ? (
                <div className="form-alert error">{participantsModal.error}</div>
              ) : participantsModal.participants.length === 0 ? (
                <div className="empty-state-card">
                  <span className="empty-icon">👥</span>
                  <h3>No Participants Yet</h3>
                  <p>No students have registered for this event yet.</p>
                </div>
              ) : (
                <>
                  {/* Sorting & Export Toolbar */}
                  <div className="participants-toolbar">
                    <div className="sort-control-group">
                      <label htmlFor="participantSort">
                        <span className="sort-icon">↕️</span> Sort Students By:
                      </label>
                      <select
                        id="participantSort"
                        value={participantSortOrder}
                        onChange={(e) => setParticipantSortOrder(e.target.value)}
                        className="sort-select"
                      >
                        <option value="name-asc">Student Name (A to Z)</option>
                        <option value="name-desc">Student Name (Z to A)</option>
                        <option value="email-asc">Student Email (A to Z)</option>
                        <option value="date-asc">Registration Date (Oldest First)</option>
                        <option value="date-desc">Registration Date (Newest First)</option>
                      </select>
                    </div>

                    <div className="toolbar-stats">
                      <span>Total: <strong>{participantsModal.participants.length}</strong> registered students</span>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Student Email</th>
                          <th>Student ID</th>
                          <th>Registration Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortParticipants(participantsModal.participants, participantSortOrder).map(
                          (p, idx) => (
                            <tr key={p._id || p.registrationId || idx}>
                              <td>{idx + 1}</td>
                              <td className="font-semibold">{p.studentName}</td>
                              <td>{p.studentEmail}</td>
                              <td>
                                <span className="text-muted text-xs">
                                  {p.userId || p.registrationId || '-'}
                                </span>
                              </td>
                              <td>
                                {p.registrationDate
                                  ? new Date(p.registrationDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })
                                  : 'N/A'}
                              </td>
                              <td>
                                <span className="status-badge registered">
                                  {p.participationStatus || 'Registered'}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer modal-footer-between">
              {participantsModal.participants.length > 0 ? (
                <button
                  onClick={() =>
                    generateParticipantsPDF(
                      participantsModal.event,
                      participantsModal.participants,
                      participantSortOrder
                    )
                  }
                  className="btn btn-primary btn-sm"
                  title="Download sorted PDF report of registered participants"
                >
                  📥 Download PDF Report ({participantsModal.participants.length})
                </button>
              ) : (
                <div></div>
              )}
              <button onClick={handleCloseParticipants} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvents;
