import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com';

const GoogleLogin = ({ onSuccess }) => {
    const googleLogin = useAuthStore((s) => s.googleLogin);

    useEffect(() => {
        if (window.google && window.google.accounts) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false,
            });

            window.google.accounts.id.renderButton(
                document.getElementById('googleSignInDiv'),
                { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill' }
            );
        }
    }, []);

    const handleCredentialResponse = async (response) => {
        try {
            const { data } = await api.post('/auth/google', {
                credential: response.credential,
            });
            googleLogin(data);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            alert('Google sign in failed');
        }
    };

    return <div id="googleSignInDiv"></div>;
};

export default GoogleLogin;