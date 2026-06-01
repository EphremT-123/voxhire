import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
    user: null,
    token: localStorage.getItem('voxhire-token') || null,
    isAuthenticated: !!localStorage.getItem('voxhire-token'),

    // Login
    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('voxhire-token', data.token);
        set({ user: data, token: data.token, isAuthenticated: true });
        return data;
    },

    // Register
    register: async (formData) => {
        const { data } = await api.post('/auth/register', formData);
        localStorage.setItem('voxhire-token', data.token);
        set({ user: data, token: data.token, isAuthenticated: true });
        return data;
    },

    // Logout
    logout: () => {
        localStorage.removeItem('voxhire-token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    // Check if token still valid (fetch profile)
    fetchUser: async () => {
        try {
            const { data } = await api.get('/auth/me');
            set({ user: data, isAuthenticated: true });
        } catch (error) {
            localStorage.removeItem('voxhire-token');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },
}));

export default useAuthStore;