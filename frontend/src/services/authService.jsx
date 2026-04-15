import axiosInstance from './axios.jsx';

export const authService = {
  register: async (userData) => {
    // If doctor, send as FormData for file upload
    if (userData.role === 'doctor' && userData.certificationFile) {
      const formData = new FormData();
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('role', userData.role);
      formData.append('specialization', userData.specialization);
      formData.append('experience', userData.experience || 0);
      formData.append('standoutReason', userData.standoutReason);
      formData.append('certification', userData.certificationFile);

      const response = await axiosInstance.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    // Normal JSON registration for patients/admins
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
};
