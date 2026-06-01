import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const UserSearch = () => {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [searched, setSearched] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.get(`/users/search?q=${query}`);
            setUsers(data);
            setSearched(true);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="max-w-2xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-4">Find Users</h1>
                <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                    <input type="text" placeholder="Search by username..." value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 p-2 border rounded" required />
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Search</button>
                </form>

                {searched && users.length === 0 && <p className="text-gray-500">No users found.</p>}

                <div className="space-y-3">
                    {users.map((u) => (
                        <div key={u._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{u.name} <span className="text-gray-500">@{u.username}</span></p>
                                <p className="text-sm text-gray-600 capitalize">{u.role}</p>
                                {u.showEmail && <p className="text-sm text-gray-500">{u.email}</p>}
                            </div>
                            <button onClick={() => navigate(`/profile/${u._id}`)}
                                className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">
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