import { useEffect } from 'react';
import { useCall } from '../context/CallContext';
import { FiPhoneCall, FiVideo, FiPhoneOff } from 'react-icons/fi';

const IncomingCallRing = () => {
  const { incomingCall, answerCall, rejectCall } = useCall();

  // Play a ringing sound when incoming Call appears
  useEffect(() => {
    if (!incomingCall) return;
    
    // In a real app we'd load an actual audio file, e.g.
    // const audio = new Audio('/ringtone.mp3');
    // audio.loop = true;
    // audio.play().catch(console.error);
    // return () => audio.pause();
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-ig-darker border border-ig-border rounded-2xl w-full max-w-sm p-6 flex flex-col items-center text-center shadow-2xl animate-miniChatSlideUp">
        
        <div className="w-24 h-24 rounded-full bg-ig-card overflow-hidden border-4 border-ig-primary mb-4 p-1 animate-pulse">
          <div className="w-full h-full rounded-full overflow-hidden bg-ig-dark">
            {incomingCall.callerAvatar ? (
              <img src={incomingCall.callerAvatar} alt={incomingCall.callerName} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-4xl font-bold bg-ig-card">
                {incomingCall.callerName?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-1">{incomingCall.callerName}</h2>
        <p className="text-ig-text-secondary mb-8">
          is requesting a {incomingCall.isVideo ? 'video' : 'voice'} call...
        </p>

        <div className="flex items-center justify-center gap-6 w-full">
          <button 
            onClick={rejectCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-3xl shadow-lg transition-transform hover:scale-110"
          >
            <FiPhoneOff />
          </button>
          
          <button 
            onClick={answerCall}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white text-3xl shadow-lg transition-transform hover:scale-110"
          >
            {incomingCall.isVideo ? <FiVideo /> : <FiPhoneCall />}
          </button>
        </div>

      </div>
    </div>
  );
};

export default IncomingCallRing;
