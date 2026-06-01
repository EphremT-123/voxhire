import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const ProjectCreate = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        script: '',
        language: 'English',
        accent: 'American',
        gender: 'any',
        budget: '',
        deadline: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/projects', {
                ...form,
                budget: Number(form.budget),
            });
            navigate('/projects');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create project');
        }
    };

    return (
        <div>
            <Navbar />
            <div className="max-w-xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Post a New Project</h1>
                {error && <p className="text-red-500 mb-3">{error}</p>}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
                    <input name="title" placeholder="Title" value={form.title} onChange={handleChange} className="w-full p-2 border rounded" required />
                    <textarea name="script" placeholder="Script text" value={form.script} onChange={handleChange} className="w-full p-2 border rounded" rows={4} required />
                    <input name="language" placeholder="Language" value={form.language} onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input name="accent" placeholder="Accent" value={form.accent} onChange={handleChange} className="w-full p-2 border rounded" required />
                    <select name="gender" value={form.gender} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="any">Any</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                    <input name="budget" type="number" placeholder="Budget ($)" value={form.budget} onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input name="deadline" type="date" value={form.deadline} onChange={handleChange} className="w-full p-2 border rounded" required />
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">Create Project</button>
                </form>
            </div>
        </div>
    );
};

export default ProjectCreate;