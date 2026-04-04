import axios from 'axios';

// Dynamically determine the backend URL based on the current host
// This allows the app to work from any IP/domain (localhost, 192.168.x.x, etc.)
const getBackendURL = () => {
  const hostname = window.location.hostname;
  const backendPort = 8000; // Django backend port
  return `http://${hostname}:${backendPort}`;
};

// Create axios instance with dynamic config
const axiosInstance = axios.create({
  baseURL: getBackendURL(),
  withCredentials: true, // CRITICAL: Sends cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`[REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for debugging and error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[RESPONSE] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[ERROR] ${error.response.status} ${error.config?.url}`);
      console.error('Error details:', error.response.data);
    } else if (error.request) {
      console.error('[ERROR] No response received from server');
    } else {
      console.error('[ERROR]', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;