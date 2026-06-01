import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const VideoCall = ({ sessionId, userId, userName, onClose }) => {
    const [status, setStatus] = useState('Connecting...');
    const [callActive, setCallActive] = useState(false);
    const [otherReady, setOtherReady] = useState(false);
    const [hasVideo, setHasVideo] = useState(true);
    const [initiator, setInitiator] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        console.log('🎥 VideoCall mounted');
        console.log('   Session:', sessionId);
        console.log('   User ID:', userId);

        const socketHost = window.location.hostname === 'localhost'
            ? 'http://localhost:5000'
            : `http://${window.location.hostname}:5000`;

        const socket = io(socketHost, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            setStatus('Connected to server');
            socket.emit('join-session', { sessionId, userId });
        });

        socket.on('user-joined', ({ userId: joinedId }) => {
            console.log('👤 Other user joined:', joinedId);
            setOtherReady(true);
            setStatus('Other person ready! Click Start Call');
        });

        socket.on('offer', async ({ offer, fromUserId }) => {
            console.log('📞 Received offer from:', fromUserId);
            setInitiator(false);

            if (!streamRef.current) {
                console.log('⏳ Starting media first...');
                await startMedia();
            }

            const pc = createPeerConnection(socket);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { sessionId, answer });
            setCallActive(true);
            setStatus('✅ Connected!');
        });

        socket.on('answer', async ({ answer }) => {
            console.log('📞 Received answer');
            if (pcRef.current) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                setCallActive(true);
                setStatus('✅ Connected!');
            }
        });

        socket.on('ice-candidate', async ({ candidate }) => {
            if (pcRef.current && candidate) {
                try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.log('ICE warning:', e.message);
                }
            }
        });

        socket.on('hang-up', () => {
            console.log('🔴 Remote hung up');
            cleanup();
            setStatus('Call ended');
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Socket error:', err.message);
            setStatus('Connection error: ' + err.message);
        });

        // Start camera after a short delay
        setTimeout(() => {
            startMedia();
        }, 800);

        return () => {
            cleanup();
            socket.close();
        };
    }, []);

    const startMedia = async () => {
        try {
            console.log('📷 Starting camera...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: true
            });
            streamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setHasVideo(true);
            setStatus('Camera ready');
            console.log('✅ Camera & mic ready');
        } catch (videoErr) {
            console.log('⚠️ Video failed, trying audio:', videoErr.message);
            setHasVideo(false);
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                });
                streamRef.current = audioStream;
                setStatus('Audio only mode');
                console.log('✅ Audio ready');
            } catch (audioErr) {
                console.error('❌ Audio failed:', audioErr.message);
                setStatus('Cannot access media. Please allow permissions.');
            }
        }
    };

    const createPeerConnection = (socket) => {
        console.log('🔧 Creating peer connection');
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('📤 Sending ICE candidate');
                socket.emit('ice-candidate', { sessionId, candidate: event.candidate });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('📡 Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setStatus('✅ Call active!');
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                setStatus('Connection lost');
            }
        };

        pc.ontrack = (event) => {
            console.log('📥 Received track:', event.track.kind);
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Add local tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                console.log('➕ Adding track:', track.kind);
                pc.addTrack(track, streamRef.current);
            });
        }

        pcRef.current = pc;
        return pc;
    };

    const startCall = async () => {
        console.log('📞 Starting call...');
        setInitiator(true);

        if (!streamRef.current) {
            await startMedia();
        }
        if (!streamRef.current) {
            alert('Please allow camera/microphone access!');
            return;
        }

        const socket = socketRef.current;
        if (!socket) {
            alert('Not connected to server');
            return;
        }

        const pc = createPeerConnection(socket);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { sessionId, offer });
        setStatus('Calling...');
        console.log('📤 Offer sent');
    };

    const cleanup = () => {
        console.log('🧹 Cleaning up...');
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCallActive(false);
    };

    const hangUp = () => {
        console.log('🔴 Hanging up');
        if (socketRef.current) {
            socketRef.current.emit('hang-up', { sessionId });
        }
        cleanup();
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={hangUp}>
            <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">
                        {hasVideo ? '📹' : '🎤'} Video Call with {userName}
                    </h3>
                    <span className="text-sm text-yellow-400 px-3">{status}</span>
                    <button onClick={hangUp} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="relative bg-gray-800 rounded-xl overflow-hidden" style={{ minHeight: '280px' }}>
                        {hasVideo ? (
                            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center"><div className="text-6xl mb-2">🎤</div><p>Audio Only</p></div>
                            </div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">You</span>
                    </div>
                    <div className="relative bg-gray-800 rounded-xl overflow-hidden" style={{ minHeight: '280px', backgroundColor: '#1a1a2e' }}>
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        {!callActive && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <div className="text-6xl mb-2">📹</div>
                                    <p>{otherReady ? 'Ready' : 'Waiting...'}</p>
                                </div>
                            </div>
                        )}
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">Remote</span>
                    </div>
                </div>

                <div className="flex justify-center gap-4">
                    {!callActive && otherReady && (
                        <button onClick={startCall} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-green-700 animate-pulse">
                            📞 Start Call
                        </button>
                    )}
                    {callActive && (
                        <button onClick={hangUp} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-700">
                            🔴 End Call
                        </button>
                    )}
                    {!otherReady && !callActive && (
                        <p className="text-gray-400 text-lg">Waiting for the other person to join the call...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoCall;