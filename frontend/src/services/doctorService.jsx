import axiosInstance from './axios.jsx';

export const doctorService = {
  // Get all doctors with filters
  listDoctors: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.specialization) params.append('specialization', filters.specialization);
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.page) params.append('page', filters.page);

    const response = await axiosInstance.get(`/doctors?${params.toString()}`);
    return response.data;
  },

  // Get doctor profile
  getDoctorProfile: async (doctorId) => {
    const response = await axiosInstance.get(`/doctors/${doctorId}`);
    return response.data;
  },

  // Add review
  addReview: async (appointmentId, doctorId, rating, comment = '') => {
    const response = await axiosInstance.post('/reviews', {
      appointmentId,
      doctorId,
      rating,
      comment,
    });
    return response.data;
  },

  getPendingRatings: async () => {
    const response = await axiosInstance.get('/reviews/pending/me');
    return response.data;
  },

  // Get doctor reviews
  getDoctorReviews: async (doctorId) => {
    const response = await axiosInstance.get(`/reviews/${doctorId}`);
    return response.data;
  },
};
