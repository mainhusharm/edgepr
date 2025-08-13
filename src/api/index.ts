import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5007', // Adjust this to your backend URL
});

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Dispatch a custom event to notify the app of session invalidation
      window.dispatchEvent(new CustomEvent('session-invalid'));
    }
    return Promise.reject(error);
  }
);

export default api;
