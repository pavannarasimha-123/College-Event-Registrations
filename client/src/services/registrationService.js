import api from './api';

export const registrationService = {
  registerEvent: async (eventId) => {
    const response = await api.post('/registrations/registerEvent', { eventId });
    return response.data;
  },

  getMyRegistrations: async () => {
    const response = await api.get('/registrations/myRegistrations');
    return response.data;
  },

  cancelRegistration: async (registrationId) => {
    const response = await api.delete(`/registrations/cancelRegistration/${registrationId}`);
    return response.data;
  },

  getEventParticipants: async (eventId) => {
    const response = await api.get(`/registrations/event/${eventId}`);
    return response.data;
  }
};
