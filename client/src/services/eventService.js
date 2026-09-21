import api from './api';

export const eventService = {
  getAllEvents: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  getAdminStats: async () => {
    const response = await api.get('/events/admin/stats');
    return response.data;
  }
};
