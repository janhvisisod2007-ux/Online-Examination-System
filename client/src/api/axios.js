import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem("user");

      if (stored) {
        const { token } = JSON.parse(stored);

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("Error reading authentication token:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;