import axios from 'axios';

const PRODUCTION_URL = 'https://voxhire-backend.onrender.com/api';
const DEVELOPMENT_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: window.location.hostname === 'localhost'
        ? DEVELOPMENT_URL
        : PRODUCTION_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('voxhire-token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('voxhire-token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;