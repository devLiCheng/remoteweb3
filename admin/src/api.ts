import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(msg));
  },
);

export default api;
