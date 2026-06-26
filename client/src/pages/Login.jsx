import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import GoogleLogin from '../components/GoogleLogin';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-md w-96 border border-gray-200">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Login to VoxHire</h2>
                {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-3 mb-4 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 mb-4 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button className="w-full bg-gray-900 text-white p-3 rounded-xl font-semibold hover:bg-gray-800 transition">
                    Login
                </button>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">Or</p>
                    <GoogleLogin onSuccess={() => navigate('/dashboard')} />
                </div>

                <p className="mt-4 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-gray-900 font-semibold hover:underline">
                        Register
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Login;