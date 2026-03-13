import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Ensure we don't infinitely retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to exchange the HttpOnly refreshToken for a new HttpOnly accessToken
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
          {},
          { withCredentials: true },
        );

        // If successful, re-run the previous failed request seamlessly!
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = '/auth/login';
        // Refresh token also died or isn't present
        console.error('Refresh token failed:', refreshError);
        // The frontend Auth Context or route guards will handle redirecting the user to login
      }
    }

    return Promise.reject(error);
  },
);

export default api;
