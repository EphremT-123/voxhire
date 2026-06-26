import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';

const UserSearch = () => {
    const user = useAuthStore((s) => s.user);
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [searched, setSearched] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.get(`/users/search?q=${query}`);
            // Artists cannot see clients in search results
            const filtered = user.role === 'artist' ? data.filter(u => u.role !== 'client') : data;
            setUsers(filtered);
            setSearched(true);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Find Users</h1>
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:border-gray-600 outline-none text-gray-800"
                        required
                    />
                    <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium">
                        Search
                    </button>
                </form>

                {searched && users.length === 0 && <p className="text-gray-500">No users found.</p>}

                <div className="space-y-3">
                    {users.map((u) => (
                        <div key={u._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-900">{u.name} <span className="text-gray-400">@{u.username}</span></p>
                                <p className="text-sm text-gray-500 capitalize">{u.role}</p>
                            </div>
                            <button
                                onClick={() => navigate(`/profile/${u._id}`)}
                                className="bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-medium"
                            >
                                View Profile
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserSearch;