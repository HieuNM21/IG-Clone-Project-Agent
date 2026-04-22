import { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiMaximize } from 'react-icons/fi';

const ActiveCallUI = () => {
  const { 
    activeCall, callStatus, 
    localStream, remoteStream, 
    isMuted, isVideoEnabled,
    toggleMute, toggleVideo, endCall 
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const isConnected = callStatus === 'connected';

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
        {!remoteStream && (
          <div className="flex flex-col items-center justify-center animate-pulse">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-ig-darker mb-4">
              {activeCall.targetAvatar ? (
                <img src={activeCall.targetAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-4xl font-bold bg-ig-card">
                  {activeCall.targetName?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{activeCall.targetName}</h2>
            <p className="text-gray-400">{callStatus === 'calling' ? 'Calling...' : 'Connecting...'}</p>
          </div>
        )}
        
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover ${!remoteStream ? 'hidden' : ''}`}
        />
      </div>

      {/* Local Video (Picture-in-Picture) */}
      {activeCall.isVideo && (
        <div className="absolute top-6 right-6 w-32 md:w-48 aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10 transition-all hover:scale-105">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover mirror"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <FiVideoOff className="text-white text-2xl" />
            </div>
          )}
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-black/60 backdrop-blur-md rounded-full border border-white/10 z-20 shadow-2xl">
        
        {/* Toggle Mic */}
        <button 
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
            isMuted ? 'bg-red-500/90 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          {isMuted ? <FiMicOff /> : <FiMic />}
        </button>

        {/* Toggle Video */}
        {activeCall.isVideo && (
          <button 
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
              !isVideoEnabled ? 'bg-red-500/90 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {!isVideoEnabled ? <FiVideoOff /> : <FiVideo />}
          </button>
        )}

        {/* End Call */}
        <button 
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-3xl shadow-lg transition-transform hover:scale-110 text-white ml-2"
        >
          <FiPhoneOff />
        </button>
      </div>

    </div>
  );
};

export default ActiveCallUI;
