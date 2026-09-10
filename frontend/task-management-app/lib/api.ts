import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7070/api', // The .NET Core API backend
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    // We only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
