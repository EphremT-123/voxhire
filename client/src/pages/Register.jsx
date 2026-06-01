import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-amber-800 to-blue-900">
            <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur p-8 rounded-2xl shadow-2xl w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-amber-900">Create VoxHire Account</h2>
                {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
                <input type="text" placeholder="Full Name" className="w-full p-3 mb-3 border-2 border-amber-200 rounded-xl focus:border-blue-600 outline-none"
                    value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="text" placeholder="Username (unique)" className="w-full p-3 mb-3 border-2 border-amber-200 rounded-xl focus:border-blue-600 outline-none"
                    value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type="email" placeholder="Email" className="w-full p-3 mb-3 border-2 border-amber-200 rounded-xl focus:border-blue-600 outline-none"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" className="w-full p-3 mb-3 border-2 border-amber-200 rounded-xl focus:border-blue-600 outline-none"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                <select className="w-full p-3 mb-4 border-2 border-amber-200 rounded-xl focus:border-blue-600 outline-none bg-white"
                    value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="client">👔 Client</option>
                    <option value="artist">🎤 Artist</option>
                </select>
                <button className="w-full bg-gradient-to-r from-amber-800 to-blue-800 text-white p-3 rounded-xl font-semibold hover:shadow-lg transition">
                    Register
                </button>
                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-blue-700 font-semibold hover:underline">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;