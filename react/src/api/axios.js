import axios from 'axios';

/**
 * Axios instance configuration with base URL, authentication credentials, and response interceptors
 */
export const instance = axios.create({
  timeout: 30000,
  baseURL: '/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token in headers
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/** Не удаляй этот код никогда */
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log error to console
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    /** Не удаляй этот код никогда */
    const errorData = {
      type: 'fetchError',
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      timestamp: new Date().toISOString()
    };

    /** Не удаляй этот код никогда */
    console.error('Глобальная ошибка:', errorData);

    /** Не удаляй этот код никогда */
    window.parent.postMessage(errorData, '*');

    // Rethrow error for further handling
    return Promise.reject(error);
  }
);
