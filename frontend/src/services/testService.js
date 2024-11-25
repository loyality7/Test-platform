import api from './api';

export const testService = {
  createTest: async (testData) => {
    try {
      const response = await api.post('/tests', testData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create test');
    }
  },

  // Add more test-related API calls here
  getTestById: async (id) => {
    try {
      const response = await api.get(`/tests/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch test');
    }
  }
}; 