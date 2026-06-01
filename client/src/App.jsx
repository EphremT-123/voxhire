import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Feed from './pages/Feed';
import PostJob from './pages/PostJob';
import Applications from './pages/Applications';
import MyApplications from './pages/MyApplications';
import Profile from './pages/Profile';
import Chat from './pages/Chat';

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (isAuthenticated) await fetchUser();
      setReady(true);
    };
    init();
  }, []);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 to-blue-900 text-white text-xl">
      Loading VoxHire...
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/jobs" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/feed" element={isAuthenticated ? <Feed /> : <Navigate to="/login" />} />
        <Route path="/post-job" element={isAuthenticated && user?.role === 'client' ? <PostJob /> : <Navigate to="/dashboard" />} />
        <Route path="/applications/:id" element={isAuthenticated && user?.role === 'client' ? <Applications /> : <Navigate to="/dashboard" />} />
        <Route path="/my-applications" element={isAuthenticated && user?.role === 'artist' ? <MyApplications /> : <Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/profile/:id" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/chat" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;