import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data } = await api.get('/projects');
                setProjects(data);
            } catch (err) {
                console.error('Failed to load projects', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    return (
        <div>
            <Navbar />
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Open Projects</h1>
                    <button
                        onClick={() => navigate('/projects/create')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        Post New Project
                    </button>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : projects.length === 0 ? (
                    <p>No open projects yet.</p>
                ) : (
                    <div className="space-y-4">
                        {projects.map((project) => (
                            <div
                                key={project._id}
                                onClick={() => navigate(`/projects/${project._id}`)}
                                className="bg-white p-4 rounded shadow hover:shadow-md cursor-pointer"
                            >
                                <h3 className="text-lg font-semibold">{project.title}</h3>
                                <p className="text-sm text-gray-600">
                                    Budget: ${project.budget} | Language: {project.language} ({project.accent}) | By: {project.client?.name}
                                </p>
                                <p className="text-sm text-gray-500 mt-1 truncate">{project.script}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Projects;