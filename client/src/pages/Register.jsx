import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import GoogleLogin from '../components/GoogleLogin';

const Register = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('client');
    const [error, setError] = useState('');
    const register = useAuthStore((s) => s.register);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register({ name, username, email, password, role });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-md w-96 border border-gray-200">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Create VoxHire Account</h2>
                {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
                <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-3 mb-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Username (unique)"
                    className="w-full p-3 mb-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-3 mb-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 mb-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <select
                    className="w-full p-3 mb-4 border border-gray-300 rounded-xl focus:border-gray-600 outline-none bg-white text-gray-800"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="client">👔 Client</option>
                    <option value="artist">🎤 Artist</option>
                </select>
                <button className="w-full bg-gray-900 text-white p-3 rounded-xl font-semibold hover:bg-gray-800 transition">
                    Register
                </button>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">Or</p>
                    <GoogleLogin onSuccess={() => navigate('/dashboard')} />
                </div>

                <p className="mt-4 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-gray-900 font-semibold hover:underline">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Register;