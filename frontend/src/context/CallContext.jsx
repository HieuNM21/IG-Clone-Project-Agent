import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const CallProvider = ({ children }) => {
  const { subscribe, sendMessage, connected } = useWebSocket();
  const { user } = useAuth();

  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, callerAvatar, isVideo, sdp }
  const [activeCall, setActiveCall] = useState(null); // { targetId, targetName, targetAvatar, isVideo }

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const cleanupCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setIncomingCall(null);
    setActiveCall(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
  }, []);

  const sendSignal = useCallback((type, targetId, payload = null, isVideo = false) => {
    sendMessage('/app/call.signal', { type, targetId, payload, isVideo });
  }, [sendMessage]);

  // STOMP subscriber for incoming signals
  useEffect(() => {
    if (!connected || !user) return;

    const sub = subscribe('/user/queue/call', async (msg) => {
      const { type, callerId, callerName, callerAvatar, payload, isVideo } = msg;

      try {
        if (type === 'offer') {
          // If already in a call, we should automatically reject or just ignore (can also send 'busy')
          if (callStatus !== 'idle' || incomingCall) {
            sendSignal('reject', callerId);
            return;
          }
          setIncomingCall({ callerId, callerName, callerAvatar, isVideo, sdp: payload });
          setCallStatus('ringing');
        } else if (type === 'answer') {
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload));
            setCallStatus('connected');
          }
        } else if (type === 'ice-candidate') {
          if (pcRef.current && payload) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload));
          }
        } else if (type === 'reject') {
          alert('Call declined');
          cleanupCall();
        } else if (type === 'end') {
          cleanupCall();
        }
      } catch (err) {
        console.error('Call signaling error:', err);
      }
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [connected, user, callStatus, incomingCall, sendSignal, cleanupCall]);

  const setupPeerConnection = useCallback((targetId, isVideo) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // Send ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal('ice-candidate', targetId, e.candidate, isVideo);
      }
    };

    // Receive remote stream
    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
      }
    };

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Connection state changes
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        cleanupCall();
      }
    };

    return pc;
  }, [sendSignal, cleanupCall]);

  const startCall = useCallback(async (targetUser, isVideo = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsVideoEnabled(isVideo);

      setActiveCall({
        targetId: targetUser.id,
        targetName: targetUser.username,
        targetAvatar: targetUser.avatarUrl,
        isVideo
      });
      setCallStatus('calling');

      const pc = setupPeerConnection(targetUser.id, isVideo);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal('offer', targetUser.id, pc.localDescription, isVideo);
    } catch (err) {
      console.error('Failed to start call', err);
      alert('Could not access camera/microphone.');
      cleanupCall();
    }
  }, [setupPeerConnection, sendSignal, cleanupCall]);

  const answerCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      const { callerId, callerName, callerAvatar, isVideo, sdp } = incomingCall;
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsVideoEnabled(isVideo);

      setActiveCall({
        targetId: callerId,
        targetName: callerName,
        targetAvatar: callerAvatar,
        isVideo
      });
      setCallStatus('connected');
      setIncomingCall(null);

      const pc = setupPeerConnection(callerId, isVideo);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal('answer', callerId, pc.localDescription, isVideo);
    } catch (err) {
      console.error('Failed to answer call', err);
      sendSignal('reject', incomingCall.callerId);
      cleanupCall();
    }
  }, [incomingCall, setupPeerConnection, sendSignal, cleanupCall]);

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      sendSignal('reject', incomingCall.callerId);
      cleanupCall();
    }
  }, [incomingCall, sendSignal, cleanupCall]);

  const endCall = useCallback(() => {
    if (activeCall) {
      sendSignal('end', activeCall.targetId);
    }
    cleanupCall();
  }, [activeCall, sendSignal, cleanupCall]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        incomingCall,
        activeCall,
        localStream,
        remoteStream,
        isMuted,
        isVideoEnabled,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
