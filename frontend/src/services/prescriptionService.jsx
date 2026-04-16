import axiosInstance from './axios.jsx';

export const prescriptionService = {
  createPrescription: async (appointmentId, medicines, notes) => {
    const response = await axiosInstance.post('/prescriptions', {
      appointmentId,
      medicines,
      notes,
    });
    return response.data;
  },

  getPrescription: async (prescriptionId) => {
    const response = await axiosInstance.get(`/prescriptions/${prescriptionId}`);
    return response.data;
  },

  getPrescriptionByAppointment: async (appointmentId) => {
    const response = await axiosInstance.get(
      `/prescriptions/appointment/${appointmentId}`
    );
    return response.data;
  },
};
