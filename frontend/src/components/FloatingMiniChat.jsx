import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useMiniChat } from '../context/MiniChatContext';
import { useCall } from '../context/CallContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { IoSend, IoClose, IoRemove, IoChevronBack } from 'react-icons/io5';
import { FiUsers, FiEdit, FiSearch, FiPhone, FiVideo } from 'react-icons/fi';

const FloatingMiniChat = () => {
  const { isOpen, isMinimized, activeConversation, closeChat, minimizeChat, restoreChat, openChat } = useMiniChat();
  const { startCall } = useCall();
  const { subscribe, connected } = useWebSocket();
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Conversation list mode
  const [showConversationList, setShowConversationList] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const isGroup = activeConversation?.type === 'group';
  const target = activeConversation?.data;

  // Load conversations list
  const loadConversations = useCallback(async () => {
    setLoadingConvos(true);
    try {
      const [dmRes, grpRes] = await Promise.all([
        api.get('/chat/conversations'),
        api.get('/groups'),
      ]);
      const dmItems = (dmRes.data || []).map((c) => ({
        type: 'user', data: c, name: c.username, avatarUrl: c.avatarUrl,
        subtitle: c.lastMessage || c.fullName || '',
      }));
      const grpItems = (grpRes.data || []).map((g) => ({
        type: 'group', data: g, name: g.name, avatarUrl: null,
        subtitle: g.lastMessage || `${g.members?.length || 0} members`,
      }));
      const merged = [...dmItems, ...grpItems];
      merged.sort((a, b) => {
        const timeA = a.data?.lastMessageTime;
        const timeB = b.data?.lastMessageTime;
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        return new Date(timeB) - new Date(timeA);
      });
      setConversations(merged);
    } catch (err) { console.error(err); }
    finally { setLoadingConvos(false); }
  }, []);

  // When opening conversation list or when there is no target, load data
  useEffect(() => {
    if (showConversationList || !target) {
      loadConversations();
    }
  }, [showConversationList, target, loadConversations]);

  // If target changes to null, ensure we show list
  useEffect(() => {
    if (!target) {
      setShowConversationList(true);
    }
  }, [target]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!target) { setMessages([]); return; }
    const fetchMessages = async () => {
      try {
        const url = isGroup ? `/chat/group/${target.id}` : `/chat/messages/${target.id}`;
        const res = await api.get(url);
        setMessages(res.data);
      } catch (err) { console.error('MiniChat: failed loading messages', err); }
    };
    fetchMessages();
    setShowConversationList(false);
  }, [target, isGroup]);

  // Subscribe to new messages
  useEffect(() => {
    if (!connected || !target) return;
    if (isGroup) {
      const sub = subscribe(`/topic/group.${target.id}`, (msg) => {
        setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      });
      return () => { if (sub) sub.unsubscribe(); };
    } else {
      const sub = subscribe('/user/queue/messages', (msg) => {
        if (msg.senderId === target.id || msg.receiverId === target.id) {
          setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
        }
      });
      return () => { if (sub) sub.unsubscribe(); };
    }
  }, [connected, target, isGroup, subscribe]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !target) return;
    const content = newMessage;
    setNewMessage('');
    setSending(true);

    const tempMsg = {
      id: `temp-${Date.now()}`, senderId: user?.id, senderUsername: user?.username,
      content, createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const payload = isGroup
        ? { content, isGroup: true, groupId: String(target.id), receiverId: null }
        : { content, isGroup: false, groupId: null, receiverId: target.id };
      const res = await api.post('/chat/send', payload);
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? res.data : m)));
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setNewMessage(content);
    } finally { setSending(false); }
  };

  // Search users
  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setSearchResults(res.data.filter((u) => u.id !== user?.id));
    } catch (err) { console.error(err); }
  };

  const selectConversation = (conv) => {
    openChat({ type: conv.type, data: conv.data });
  };

  const startChatWithUser = (u) => {
    openChat({ type: 'user', data: u });
    setSearchQuery('');
    setSearchResults([]);
  };

  // Hide the widget completely if the user is on the Direct Messages page
  if (location.pathname === '/direct') return null;

  // Always show the widget if it has been opened at least once
  // When no conversation is active, show the conversation list
  if (!isOpen) return null;

  const chatName = isGroup ? target?.name : target?.username;

  return (
    <div className={`mini-chat mini-chat-enter ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b border-ig-border cursor-pointer bg-ig-card flex-shrink-0"
        onClick={isMinimized ? restoreChat : undefined}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Back button when in chat view */}
          {target && !isMinimized && (
            <button onClick={(e) => { e.stopPropagation(); setShowConversationList(true); }}
              className="p-1 hover:bg-white/10 rounded-full transition-smooth">
              <IoChevronBack className="text-base" />
            </button>
          )}

          {target && !showConversationList ? (
            <>
              {isGroup ? (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ig-primary to-ig-purple flex items-center justify-center flex-shrink-0">
                  <FiUsers className="text-white text-xs" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-ig-dark flex items-center justify-center overflow-hidden flex-shrink-0">
                  {target.avatarUrl ? <img src={target.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[10px]">{target.username?.[0]?.toUpperCase()}</span>}
                </div>
              )}
              <span className="text-sm font-semibold truncate">{chatName}</span>
            </>
          ) : (
            <span className="text-sm font-semibold">Messages</span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {/* Call actions for 1v1 */}
          {!isMinimized && !showConversationList && target && !isGroup && (
            <>
              <button onClick={(e) => { e.stopPropagation(); startCall(target, false); }}
                className="p-1 hover:bg-white/10 rounded-full transition-smooth mr-0.5">
                <FiPhone className="text-sm" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); startCall(target, true); }}
                className="p-1 hover:bg-white/10 rounded-full transition-smooth mr-1">
                <FiVideo className="text-sm" />
              </button>
            </>
          )}

          {!isMinimized && !showConversationList && !target && (
            <button onClick={(e) => { e.stopPropagation(); setShowConversationList(true); loadConversations(); }}
              className="p-1 hover:bg-white/10 rounded-full transition-smooth">
              <FiEdit className="text-sm" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); minimizeChat(); }}
            className="p-1 hover:bg-white/10 rounded-full transition-smooth">
            <IoRemove className="text-lg" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); closeChat(); }}
            className="p-1 hover:bg-white/10 rounded-full transition-smooth">
            <IoClose className="text-lg" />
          </button>
        </div>
      </div>

      {/* Body (hidden when minimized) */}
      {!isMinimized && (
        <>
          {/* Conversation List View */}
          {(showConversationList || !target) ? (
            <div className="flex-1 overflow-y-auto">
              {/* Search */}
              <div className="p-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-secondary text-xs" />
                  <input type="text" placeholder="Search..." value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-ig-dark border border-ig-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-ig-text-secondary transition-smooth placeholder-ig-text-secondary" />
                </div>
              </div>

              {/* Search results */}
              {searchResults.length > 0 ? (
                <div>
                  <p className="px-3 py-1 text-[10px] text-ig-text-secondary font-semibold uppercase">Search Results</p>
                  {searchResults.map((u) => (
                    <button key={u.id} onClick={() => startChatWithUser(u)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-smooth">
                      <div className="w-9 h-9 rounded-full bg-ig-card flex items-center justify-center overflow-hidden flex-shrink-0">
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[10px] text-ig-text-secondary">{u.username?.[0]?.toUpperCase()}</span>}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-semibold truncate">{u.username}</p>
                        {u.fullName && <p className="text-[10px] text-ig-text-secondary truncate">{u.fullName}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Existing conversations */
                <div>
                  {loadingConvos ? (
                    <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-ig-primary"></div></div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-ig-text-secondary text-xs">No conversations yet. Search to start chatting.</div>
                  ) : (
                    conversations.map((conv, i) => (
                      <button key={i} onClick={() => selectConversation(conv)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-smooth">
                        {conv.type === 'group' ? (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ig-primary to-ig-purple flex items-center justify-center flex-shrink-0">
                            <FiUsers className="text-white text-xs" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-ig-card flex items-center justify-center overflow-hidden flex-shrink-0">
                            {conv.avatarUrl ? <img src={conv.avatarUrl} alt="" className="w-full h-full object-cover" />
                              : <span className="text-[10px] text-ig-text-secondary">{conv.name?.[0]?.toUpperCase()}</span>}
                          </div>
                        )}
                        <div className="text-left min-w-0">
                          <p className="text-xs font-semibold truncate">{conv.name}</p>
                          <p className="text-[10px] text-ig-text-secondary truncate">{conv.subtitle}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Chat View */
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && (
                  <div className="text-center text-ig-text-secondary text-xs py-8">No messages yet</div>
                )}
                {messages.map((msg, idx) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div key={msg.id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {/* Avatar for others */}
                      {!isOwn && (
                        <div className="w-6 h-6 rounded-full bg-ig-card flex items-center justify-center overflow-hidden flex-shrink-0 mr-1.5 mt-auto mb-0.5">
                          {target?.avatarUrl ? <img src={target.avatarUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="text-[8px] text-ig-text-secondary">{msg.senderUsername?.[0]?.toUpperCase()}</span>}
                        </div>
                      )}
                      <div className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-[13px] ${
                        isOwn ? 'bg-gradient-to-r from-ig-primary to-ig-purple text-white rounded-br-sm' : 'bg-ig-card text-ig-text rounded-bl-sm'
                      }`}>
                        {isGroup && !isOwn && (
                          <p className="text-[10px] text-ig-text-secondary font-semibold mb-0.5">{msg.senderUsername}</p>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-2 border-t border-ig-border flex-shrink-0">
                <div className="flex items-center gap-2 bg-ig-dark border border-ig-border rounded-full px-3 py-1.5">
                  <input type="text" placeholder="Message..." value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    className="flex-1 bg-transparent text-xs focus:outline-none text-ig-text placeholder-ig-text-secondary" />
                  <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                    className="text-ig-primary disabled:opacity-30 transition-smooth">
                    <IoSend className="text-sm" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FloatingMiniChat;
