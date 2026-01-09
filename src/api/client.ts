import axios from 'axios';

// MVP: Hardcoded URL or ENV
const API_URL = 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Logout if 401 (token expired/invalid)
            localStorage.removeItem('access_token');
            // Allow app to redirect
        }
        return Promise.reject(error);
    }
);
