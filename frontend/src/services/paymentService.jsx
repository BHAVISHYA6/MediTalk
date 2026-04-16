import axiosInstance from './axios.jsx';

export const paymentService = {
  initiatePayment: async (appointmentId, amount) => {
    const response = await axiosInstance.post('/payments/initiate', {
      appointmentId,
      amount,
    });
    return response.data;
  },

  processPayment: async (paymentId, cardDetails) => {
    const response = await axiosInstance.post('/payments/process', {
      paymentId,
      cardDetails,
    });
    return response.data;
  },

  getPaymentStatus: async (appointmentId) => {
    const response = await axiosInstance.get(`/payments/${appointmentId}/status`);
    return response.data;
  },

  getPaymentDetails: async (appointmentId) => {
    const response = await axiosInstance.get(`/payments/${appointmentId}/details`);
    return response.data;
  },
};
