import axios from 'axios';

const API_URL = 'https://evaluate-api.hysterchat.com/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use((config) => {
  const newConfig = { ...config };
  newConfig.headers = newConfig.headers || {};
  
  if (newConfig.requiresAuth === false) {
    delete newConfig.headers.Authorization;
    return newConfig;
  }

  const token = localStorage.getItem('token');
  if (token) {
    newConfig.headers.Authorization = `Bearer ${token}`;
  }

  return newConfig;
});

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
      return Promise.reject({ message: 'Network error occurred' });
    }
    console.error('Request Error:', error.message);
    return Promise.reject({ message: error.message });
  }
);

// Export the service methods
export const apiService = {
  get: async (endpoint, config = {}) => {
    try {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return await axiosInstance.get(path, config);
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },

  post: async (endpoint, data = {}, config = {}) => {
    console.log('API Request:', {
      endpoint,
      data
    });
    
    try {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await axiosInstance.post(path, data, config);
      console.log('API Response:', response);
      return response;
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  },

  put: async (endpoint, data = {}, config = {}) => {
    try {
      return await axiosInstance.put(endpoint, data, config);
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  },

  delete: async (endpoint, config = {}) => {
    try {
      return await axiosInstance.delete(endpoint, config);
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
};

export default apiService; 