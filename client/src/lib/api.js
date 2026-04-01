import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 30000, // Increased to 30 seconds for slow DB queries
});

// Request interceptor: Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config.data || {});
  return config;
}, (error) => {
  console.error("[API] Request error:", error);
  return Promise.reject(error);
});

// Response interceptor: Handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ Response from ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("[API] ❌ Request timeout after 30 seconds:", error.config.url);
      error.message = "Request timeout. Backend may be slow or offline.";
    } else if (error.response) {
      console.error(`[API] ❌ Error ${error.response.status}: ${error.config.url}`, error.response.data);
      error.message = error.response.data?.message || `Error: ${error.response.status}`;
    } else if (error.request) {
      console.error("[API] ❌ No response received:", error.message);
      error.message = "No response from backend. Check if server is running.";
    } else {
      console.error("[API] ❌ Error:", error.message);
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth
      localStorage.removeItem("rb_token");
      localStorage.removeItem("rb_user");
      window.location.href = "/auth?role=user";
    }
    return Promise.reject(error);
  }
);

export default api;
