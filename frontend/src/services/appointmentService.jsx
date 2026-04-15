import axiosInstance from './axios.jsx';

export const appointmentService = {
  createAppointment: async (payload) => {
    const response = await axiosInstance.post('/appointments', payload);
    return response.data;
  },

  getMyAppointments: async () => {
    const response = await axiosInstance.get('/appointments/me');
    return response.data;
  },

  confirmAppointment: async (appointmentId) => {
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/confirm`);
    return response.data;
  },

  getJoinLink: async (appointmentId) => {
    const response = await axiosInstance.get(`/appointments/${appointmentId}/join-link`);
    return response.data;
  },

  joinAppointment: async (appointmentId) => {
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/join`);
    return response.data;
  },

  cancelAppointment: async (appointmentId) => {
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/cancel`);
    return response.data;
  },

  completeAppointment: async (appointmentId) => {
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/complete`);
    return response.data;
  },
};
