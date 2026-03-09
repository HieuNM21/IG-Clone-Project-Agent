import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { IoSend } from 'react-icons/io5';

const DirectPage = () => {
  const { user } = useAuth();
  const { subscribe, sendMessage, connected } = useWebSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/chat/conversations');
        setConversations(res.data);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Subscribe to messages
  useEffect(() => {
    if (!connected || !user) return;

    const sub = subscribe(`/user/${user.username}/queue/messages`, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [connected, user, subscribe]);

  // Fetch message history when selecting a user
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/messages/${selectedUser.id}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedUser) return;

    sendMessage('/app/chat.send', {
      receiverId: selectedUser.id,
      content: newMessage,
      isGroup: false,
      groupId: null,
    });

    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)] flex border border-ig-border rounded-xl overflow-hidden mt-4 mx-4 fade-in">
      {/* Sidebar */}
      <div className="w-80 border-r border-ig-border flex flex-col bg-ig-darker">
        <div className="p-4 border-b border-ig-border">
          <h2 className="font-semibold text-lg">{user?.username}</h2>
          <p className="text-ig-text-secondary text-xs mt-0.5">Messages</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-ig-primary"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-ig-text-secondary text-sm">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedUser(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-ig-card transition-smooth ${
                  selectedUser?.id === conv.id ? 'bg-ig-card' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-ig-card border border-ig-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {conv.avatarUrl ? (
                    <img src={conv.avatarUrl} alt={conv.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg text-ig-text-secondary">{conv.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-sm truncate">{conv.username}</p>
                  <p className="text-ig-text-secondary text-xs truncate">{conv.fullName}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-ig-dark">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-ig-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-ig-card flex items-center justify-center overflow-hidden">
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm">{selectedUser.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <span className="font-semibold text-sm">{selectedUser.username}</span>
              {connected && <span className="w-2 h-2 rounded-full bg-green-500 ml-auto"></span>}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => {
                const isOwn = msg.senderId === user?.id;
                return (
                  <div key={msg.id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                        isOwn
                          ? 'bg-gradient-to-r from-ig-primary to-ig-purple text-white rounded-br-md'
                          : 'bg-ig-card text-ig-text rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-ig-border">
              <div className="flex items-center gap-2 bg-ig-card border border-ig-border rounded-full px-4 py-2">
                <input
                  id="chat-input"
                  type="text"
                  placeholder="Message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-transparent text-sm focus:outline-none text-ig-text placeholder-ig-text-secondary"
                />
                <button
                  id="chat-send-button"
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="text-ig-primary hover:text-ig-primary-dark transition-smooth disabled:opacity-30"
                >
                  <IoSend className="text-lg" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-ig-text-secondary">
            <div className="w-20 h-20 rounded-full border-2 border-ig-text-secondary flex items-center justify-center mb-4">
              <IoSend className="text-3xl" />
            </div>
            <h3 className="text-xl font-light mb-1">Your Messages</h3>
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectPage;
