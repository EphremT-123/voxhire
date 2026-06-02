import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://voxhire-backend.onrender.com';

const VideoCall = ({ sessionId, userId, userName, onClose }) => {
    const [status, setStatus] = useState('Connecting...');
    const [callActive, setCallActive] = useState(false);
    const [otherReady, setOtherReady] = useState(false);
    const [hasVideo, setHasVideo] = useState(true);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const socket = io(SOCKET_URL, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            setStatus('Connected');
            socket.emit('join-session', { sessionId, userId });
        });

        socket.on('user-joined', () => {
            setOtherReady(true);
            setStatus('Other person ready! Click Start Call');
        });

        socket.on('offer', async ({ offer }) => {
            if (!streamRef.current) await startMedia();
            const pc = createPeerConnection(socket);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { sessionId, answer });
            setCallActive(true);
            setStatus('✅ Connected!');
        });

        socket.on('answer', async ({ answer }) => {
            if (pcRef.current) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                setCallActive(true);
                setStatus('✅ Connected!');
            }
        });

        socket.on('ice-candidate', async ({ candidate }) => {
            if (pcRef.current && candidate) {
                try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { }
            }
        });

        socket.on('hang-up', () => { cleanup(); setStatus('Call ended'); });
        setTimeout(() => startMedia(), 800);
        return () => { cleanup(); socket.close(); };
    }, []);

    const startMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
            streamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            setHasVideo(true);
            setStatus('Camera ready');
        } catch (e) {
            setHasVideo(false);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                streamRef.current = stream;
                setStatus('Audio only');
            } catch (e2) {
                setStatus('Please allow camera/microphone');
            }
        }
    };

    const createPeerConnection = (socket) => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pc.onicecandidate = (e) => { if (e.candidate) socket.emit('ice-candidate', { sessionId, candidate: e.candidate }); };
        pc.ontrack = (e) => { if (remoteVideoRef.current && e.streams[0]) remoteVideoRef.current.srcObject = e.streams[0]; };
        if (streamRef.current) streamRef.current.getTracks().forEach(t => pc.addTrack(t, streamRef.current));
        pcRef.current = pc;
        return pc;
    };

    const startCall = async () => {
        if (!streamRef.current) await startMedia();
        if (!streamRef.current) return;
        const socket = socketRef.current;
        const pc = createPeerConnection(socket);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { sessionId, offer });
        setStatus('Calling...');
    };

    const cleanup = () => {
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        setCallActive(false);
    };

    const hangUp = () => {
        if (socketRef.current) socketRef.current.emit('hang-up', { sessionId });
        cleanup();
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={hangUp}>
            <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{hasVideo ? '📹' : '🎤'} Video Call</h3>
                    <span className="text-sm text-yellow-400">{status}</span>
                    <button onClick={hangUp} className="bg-red-600 text-white px-4 py-2 rounded-xl">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="relative bg-gray-800 rounded-xl overflow-hidden" style={{ minHeight: '280px' }}>
                        {hasVideo ? <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400"><div className="text-center"><div className="text-6xl mb-2">🎤</div><p>Audio Only</p></div></div>}
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">You</span>
                    </div>
                    <div className="relative bg-gray-800 rounded-xl overflow-hidden" style={{ minHeight: '280px' }}>
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">Remote</span>
                    </div>
                </div>
                <div className="flex justify-center gap-4">
                    {!callActive && otherReady && <button onClick={startCall} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg">📞 Start Call</button>}
                    {callActive && <button onClick={hangUp} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg">🔴 End Call</button>}
                    {!otherReady && !callActive && <p className="text-gray-400 text-lg">Waiting for other person...</p>}
                </div>
            </div>
        </div>
    );
};

export default VideoCall;