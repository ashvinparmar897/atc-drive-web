import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://93.127.137.160:8000',
  // baseURL: 'http://localhost:8000',
});

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance; 
