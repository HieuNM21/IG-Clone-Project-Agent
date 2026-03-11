import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useMiniChat } from '../context/MiniChatContext';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { IoSend, IoClose } from 'react-icons/io5';
import { FiSearch, FiEdit, FiUsers, FiMoreVertical, FiTrash2, FiUserPlus, FiCornerUpLeft, FiCheck, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { IoPaperPlaneOutline } from 'react-icons/io5';

const REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
};

const DirectPage = () => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const { openChat: openMiniChat } = useMiniChat();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
  const messagesEndRef = useRef(null);

  // New conversation
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Group creation
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState([]);

  // Chat menu
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMemberQuery, setAddMemberQuery] = useState('');
  const [addMemberResults, setAddMemberResults] = useState([]);
  const chatMenuRef = useRef(null);

  // Close menu and reaction picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) setShowChatMenu(false);
      // Close reaction picker on outside click
      if (reactionPickerMsgId !== null) {
        const picker = document.querySelector('[data-reaction-picker]');
        const trigger = document.querySelector(`[data-reaction-trigger="${reactionPickerMsgId}"]`);
        if (picker && !picker.contains(e.target) && (!trigger || !trigger.contains(e.target))) {
          setReactionPickerMsgId(null);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [reactionPickerMsgId]);

  // Load conversations
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dmRes, grpRes] = await Promise.all([
          api.get('/chat/conversations'),
          api.get('/groups'),
        ]);

        const dmItems = (dmRes.data || []).map((c) => ({
          type: 'user',
          id: `user-${c.id}`,
          rawId: c.id,
          data: c,
          name: c.username,
          avatarUrl: c.avatarUrl,
          subtitle: c.lastMessage ? truncate(c.lastMessage, 30) : (c.fullName || ''),
          lastMessageTime: c.lastMessageTime,
          lastMessageIsRead: c.lastMessageIsRead,
          lastMessageSenderId: c.lastMessageSenderId,
        }));

        const grpItems = (grpRes.data || []).map((g) => ({
          type: 'group',
          id: `group-${g.id}`,
          rawId: g.id,
          data: g,
          name: g.name,
          avatarUrl: null,
          subtitle: g.lastMessage ? truncate(g.lastMessage, 30) : `${g.members?.length || 0} members`,
          lastMessageTime: g.lastMessageTime,
        }));

        const merged = [...dmItems, ...grpItems].sort((a, b) => {
          if (!a.lastMessageTime && !b.lastMessageTime) return 0;
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });
        setConversations(merged);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const truncate = (str, len) => str.length > len ? str.substring(0, len) + '…' : str;

  // Handle navigation state
  useEffect(() => {
    if (location.state?.startChatWith) {
      const chatUser = location.state.startChatWith;
      const chatItem = {
        type: 'user', id: `user-${chatUser.id}`, rawId: chatUser.id,
        data: chatUser, name: chatUser.username, avatarUrl: chatUser.avatarUrl,
        subtitle: chatUser.fullName || '',
      };
      setSelectedChat(chatItem);
      setConversations((prev) => {
        if (prev.find((c) => c.id === chatItem.id)) return prev;
        return [chatItem, ...prev];
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Helper: update conversation preview when a message arrives
  const updateConversationPreview = useCallback((message) => {
    setConversations((prev) => {
      let found = false;
      const updated = prev.map((conv) => {
        // Match DM: the message is from or to this conversation partner
        if (conv.type === 'user' && !message.isGroup) {
          if (conv.rawId === message.senderId || conv.rawId === message.receiverId) {
            found = true;
            return {
              ...conv,
              subtitle: truncate(message.content, 30),
              lastMessageTime: message.createdAt,
              lastMessageIsRead: message.senderId === user?.id, // own messages are "read"
              lastMessageSenderId: message.senderId,
            };
          }
        }
        // Match group
        if (conv.type === 'group' && message.isGroup) {
          if (String(conv.rawId) === String(message.groupId)) {
            found = true;
            return {
              ...conv,
              subtitle: truncate(`${message.senderUsername}: ${message.content}`, 30),
              lastMessageTime: message.createdAt,
            };
          }
        }
        return conv;
      });

      // Sort by lastMessageTime desc
      updated.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      });

      return updated;
    });
  }, [user?.id]);

  // Subscribe to 1-on-1 messages
  useEffect(() => {
    if (!connected || !user) return;
    const sub = subscribe('/user/queue/messages', (message) => {
      // Only add to message list if it belongs to the currently selected chat
      setSelectedChat((currentChat) => {
        if (currentChat && currentChat.type === 'user') {
          const partnerId = currentChat.rawId;
          if (message.senderId === partnerId || message.receiverId === partnerId) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }
        }
        return currentChat; // don't mutate
      });

      // Always update conversation preview
      updateConversationPreview(message);
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [connected, user, subscribe, updateConversationPreview]);

  // Subscribe to read receipts
  useEffect(() => {
    if (!connected) return;
    const sub = subscribe('/user/queue/read-receipt', () => {
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [connected, subscribe]);

  // Subscribe to reactions
  useEffect(() => {
    if (!connected) return;
    const sub = subscribe('/user/queue/reactions', (updated) => {
      setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, reaction: updated.reaction } : m));
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [connected, subscribe]);

  // Subscribe to group messages
  useEffect(() => {
    if (!connected || !selectedChat || selectedChat.type !== 'group') return;
    const sub = subscribe(`/topic/group.${selectedChat.rawId}`, (message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      updateConversationPreview(message);
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [connected, selectedChat, subscribe, updateConversationPreview]);

  // Load messages when chat selected + mark as read + update preview state
  useEffect(() => {
    if (!selectedChat) return;
    const fetchMessages = async () => {
      try {
        const url = selectedChat.type === 'group'
          ? `/chat/group/${selectedChat.rawId}`
          : `/chat/messages/${selectedChat.rawId}`;
        const res = await api.get(url);
        setMessages(res.data);

        // Mark as read on backend
        if (selectedChat.type === 'group') {
          api.post(`/chat/mark-read/group/${selectedChat.rawId}`).catch(() => {});
        } else {
          api.post(`/chat/mark-read/direct/${selectedChat.rawId}`).catch(() => {});
        }

        // Mark as read locally in conversation list
        setConversations((prev) =>
          prev.map((c) => c.id === selectedChat.id ? { ...c, lastMessageIsRead: true } : c)
        );
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    fetchMessages();
    setReplyTo(null);
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || sending || !selectedChat) return;
    const content = newMessage;
    setNewMessage('');
    setSending(true);

    const tempMsg = {
      id: `temp-${Date.now()}`, senderId: user?.id, senderUsername: user?.username,
      content, createdAt: new Date().toISOString(), replyToId: replyTo?.id || null,
      replyToContent: replyTo?.content || null, replyToUsername: replyTo?.senderUsername || null,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setReplyTo(null);

    try {
      const isGroup = selectedChat.type === 'group';
      const payload = isGroup
        ? { content, isGroup: true, groupId: String(selectedChat.rawId), receiverId: null, replyToId: replyTo?.id || null }
        : { content, isGroup: false, groupId: null, receiverId: selectedChat.rawId, replyToId: replyTo?.id || null };

      const res = await api.post('/chat/send', payload);
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? res.data : m)));
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (messageId, reaction) => {
    setReactionPickerMsgId(null);
    try {
      const res = await api.post(`/chat/messages/${messageId}/reaction`, { reaction });
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reaction: res.data.reaction } : m));
    } catch (err) { console.error(err); }
  };

  const handleDeleteConversation = async () => {
    if (!selectedChat) return;
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      if (selectedChat.type === 'group') {
        await api.delete(`/groups/${selectedChat.rawId}`);
      } else {
        await api.delete(`/chat/conversations/direct/${selectedChat.rawId}`);
      }
      setConversations((prev) => prev.filter((c) => c.id !== selectedChat.id));
      setSelectedChat(null);
      setMessages([]);
      setShowChatMenu(false);
    } catch (err) { console.error(err); }
  };

  // Search
  const handleUserSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setSearchResults(res.data.filter((u) => u.id !== user?.id));
    } catch (err) { console.error(err); }
  };

  const startConversation = (u) => {
    const chatItem = { type: 'user', id: `user-${u.id}`, rawId: u.id, data: u, name: u.username, avatarUrl: u.avatarUrl, subtitle: '' };
    setSelectedChat(chatItem);
    setConversations((prev) => prev.find((c) => c.id === chatItem.id) ? prev : [chatItem, ...prev]);
    setShowNewChat(false); setSearchQuery(''); setSearchResults([]);
  };

  // Group creation
  const handleGroupSearch = async (q) => {
    setGroupSearchQuery(q);
    if (q.length < 2) { setGroupSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setGroupSearchResults(res.data.filter((u) => u.id !== user?.id && !groupMembers.find((m) => m.id === u.id)));
    } catch (err) { console.error(err); }
  };

  const createGroup = async () => {
    if (!groupName.trim() || groupMembers.length === 0) return;
    try {
      const res = await api.post('/groups', { name: groupName, memberIds: groupMembers.map((m) => m.id) });
      const newGroup = { type: 'group', id: `group-${res.data.id}`, rawId: res.data.id, data: res.data, name: res.data.name, avatarUrl: null, subtitle: `${res.data.members?.length || 0} members` };
      setConversations((prev) => [newGroup, ...prev]);
      setSelectedChat(newGroup);
      setShowCreateGroup(false); setGroupName(''); setGroupMembers([]);
    } catch (err) { console.error(err); }
  };

  // Add members to group
  const handleAddMemberSearch = async (q) => {
    setAddMemberQuery(q);
    if (q.length < 2) { setAddMemberResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      const existingIds = selectedChat?.data?.members?.map((m) => m.id) || [];
      setAddMemberResults(res.data.filter((u) => u.id !== user?.id && !existingIds.includes(u.id)));
    } catch (err) { console.error(err); }
  };

  const addMemberToGroup = async (u) => {
    if (!selectedChat || selectedChat.type !== 'group') return;
    try {
      const res = await api.post(`/groups/${selectedChat.rawId}/members`, { memberIds: [u.id] });
      setSelectedChat((prev) => ({ ...prev, data: res.data, subtitle: `${res.data.members?.length || 0} members` }));
      setShowAddMembers(false); setAddMemberQuery(''); setAddMemberResults([]);
    } catch (err) { console.error(err); }
  };

  const isGroup = selectedChat?.type === 'group';

  return (
    <div className="h-screen flex fade-in">
      {/* Left Panel */}
      <div className="w-[350px] border-r border-ig-border flex flex-col bg-black flex-shrink-0">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h2 className="font-bold text-[20px]">{user?.username}</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowCreateGroup(!showCreateGroup); setShowNewChat(false); }}
              className="text-ig-text-secondary hover:text-ig-text transition-smooth" title="New group"><FiUsers className="text-xl" /></button>
            <button onClick={() => { setShowNewChat(!showNewChat); setShowCreateGroup(false); }}
              className="text-ig-text-secondary hover:text-ig-text transition-smooth" title="New message"><FiEdit className="text-xl" /></button>
          </div>
        </div>

        {/* New Chat Search */}
        {showNewChat && (
          <div className="px-4 pb-3 border-b border-ig-border/50">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-secondary text-sm" />
              <input type="text" placeholder="Search users..." value={searchQuery} autoFocus
                onChange={(e) => handleUserSearch(e.target.value)}
                className="w-full bg-ig-card border border-ig-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-ig-text-secondary transition-smooth placeholder-ig-text-secondary" />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto">
                {searchResults.map((u) => (
                  <button key={u.id} onClick={() => startConversation(u)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-smooth">
                    <div className="w-10 h-10 rounded-full bg-ig-card flex items-center justify-center overflow-hidden flex-shrink-0">
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-sm text-ig-text-secondary">{u.username?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold truncate">{u.username}</p>
                      {u.fullName && <p className="text-xs text-ig-text-secondary truncate">{u.fullName}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Group */}
        {showCreateGroup && (
          <div className="px-4 pb-3 border-b border-ig-border/50 space-y-2">
            <input type="text" placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-ig-card border border-ig-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ig-text-secondary transition-smooth placeholder-ig-text-secondary" />
            {groupMembers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {groupMembers.map((m) => (
                  <span key={m.id} className="bg-ig-primary/20 text-ig-primary text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {m.username} <button onClick={() => setGroupMembers((p) => p.filter((x) => x.id !== m.id))} className="hover:text-white">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-secondary text-sm" />
              <input type="text" placeholder="Add members..." value={groupSearchQuery} onChange={(e) => handleGroupSearch(e.target.value)}
                className="w-full bg-ig-card border border-ig-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-ig-text-secondary transition-smooth placeholder-ig-text-secondary" />
            </div>
            {groupSearchResults.length > 0 && (
              <div className="max-h-32 overflow-y-auto">
                {groupSearchResults.map((u) => (
                  <button key={u.id} onClick={() => { setGroupMembers((p) => [...p, u]); setGroupSearchQuery(''); setGroupSearchResults([]); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg text-sm transition-smooth"><span>{u.username}</span></button>
                ))}
              </div>
            )}
            <button onClick={createGroup} disabled={!groupName.trim() || groupMembers.length === 0}
              className="w-full py-2 bg-gradient-to-r from-ig-primary to-ig-purple text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-smooth disabled:opacity-40">Create Group</button>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-ig-primary"></div></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-ig-text-secondary text-sm mb-3">No conversations yet</p>
              <button onClick={() => setShowNewChat(true)} className="text-ig-primary text-sm font-semibold">Send message</button>
            </div>
          ) : (
            conversations.map((conv) => {
              const hasUnread = conv.type === 'user' && !conv.lastMessageIsRead && conv.lastMessageSenderId && conv.lastMessageSenderId !== user?.id;
              return (
                <button key={conv.id} onClick={() => setSelectedChat(conv)}
                  className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-smooth ${selectedChat?.id === conv.id ? 'bg-white/5' : ''}`}>
                  {conv.type === 'group' ? (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-ig-primary to-ig-purple flex items-center justify-center flex-shrink-0">
                      <FiUsers className="text-white text-xl" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-ig-card flex items-center justify-center overflow-hidden flex-shrink-0">
                      {conv.avatarUrl ? <img src={conv.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-lg text-ig-text-secondary">{conv.name?.[0]?.toUpperCase()}</span>}
                    </div>
                  )}
                  <div className="text-left min-w-0 flex-1">
                    <p className={`text-[14px] truncate ${hasUnread ? 'font-bold' : 'font-semibold'}`}>{conv.name}</p>
                    <div className="flex items-center gap-1">
                      <p className={`text-xs truncate ${hasUnread ? 'text-ig-text font-semibold' : 'text-ig-text-secondary'}`}>{conv.subtitle}</p>
                      {conv.lastMessageTime && (
                        <span className="text-ig-text-secondary text-[10px] flex-shrink-0"> · {timeAgo(conv.lastMessageTime)}</span>
                      )}
                    </div>
                  </div>
                  {hasUnread && <span className="w-2 h-2 rounded-full bg-ig-primary flex-shrink-0"></span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-ig-darker">
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-ig-border flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {isGroup ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ig-primary to-ig-purple flex items-center justify-center">
                    <FiUsers className="text-white text-lg" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-ig-card flex items-center justify-center overflow-hidden">
                    {selectedChat.avatarUrl ? <img src={selectedChat.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sm">{selectedChat.name?.[0]?.toUpperCase()}</span>}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{selectedChat.name}</p>
                  {isGroup && (
                    <p className="text-ig-text-secondary text-xs truncate">
                      {selectedChat.data.members?.map((m) => m.username).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Pop-out mini chat + Actions Menu */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openMiniChat({ type: selectedChat.type, data: selectedChat.data })}
                  className="p-2 hover:bg-white/5 rounded-full transition-smooth text-ig-text-secondary hover:text-ig-text"
                  title="Pop out chat"
                >
                  <FiExternalLink className="text-base" />
                </button>
              <div className="relative" ref={chatMenuRef}>
                <button onClick={() => setShowChatMenu(!showChatMenu)} className="p-2 hover:bg-white/5 rounded-full transition-smooth">
                  <FiMoreVertical />
                </button>
                {showChatMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-ig-card border border-ig-border rounded-xl shadow-2xl overflow-hidden z-50">
                    {isGroup && (
                      <button onClick={() => { setShowAddMembers(true); setShowChatMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-smooth text-sm text-left">
                        <FiUserPlus className="text-base" /> Add members
                      </button>
                    )}
                    <button onClick={handleDeleteConversation}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-smooth text-sm text-left text-red-400">
                      <FiTrash2 className="text-base" /> Delete conversation
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Add Members Panel */}
            {showAddMembers && isGroup && (
              <div className="px-4 py-3 border-b border-ig-border bg-ig-dark/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Add Members</span>
                  <button onClick={() => { setShowAddMembers(false); setAddMemberQuery(''); setAddMemberResults([]); }}
                    className="text-ig-text-secondary hover:text-ig-text text-sm"><IoClose /></button>
                </div>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-secondary text-sm" />
                  <input type="text" placeholder="Search users..." value={addMemberQuery} autoFocus
                    onChange={(e) => handleAddMemberSearch(e.target.value)}
                    className="w-full bg-ig-card border border-ig-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-ig-text-secondary transition-smooth placeholder-ig-text-secondary" />
                </div>
                {addMemberResults.map((u) => (
                  <button key={u.id} onClick={() => addMemberToGroup(u)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg text-sm transition-smooth">
                    <span className="font-semibold">{u.username}</span>
                    <FiUserPlus className="ml-auto text-ig-primary" />
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-1">
              {messages.length === 0 && (
                <div className="text-center py-16 text-ig-text-secondary text-sm">No messages yet. Say hi! 👋</div>
              )}
              {messages.map((msg, idx) => {
                const isOwn = msg.senderId === user?.id;
                const isLastOwn = isOwn && idx === messages.length - 1;
                // Find avatar for sender (from group members or selectedChat)
                const senderAvatar = isGroup
                  ? selectedChat.data.members?.find((m) => m.id === msg.senderId)?.avatarUrl
                  : selectedChat.avatarUrl;

                return (
                  <div key={msg.id || idx} className={msg.reaction ? 'mb-6' : 'mb-1'}>
                    {/* Reply context */}
                    {msg.replyToContent && (
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-0.5 ${!isOwn ? 'ml-12' : ''}`}>
                        <div className="text-[11px] text-ig-text-secondary flex items-center gap-1 px-3">
                          <FiCornerUpLeft className="text-[10px]" />
                          <span className="font-semibold">{msg.replyToUsername}</span>: {truncate(msg.replyToContent, 40)}
                        </div>
                      </div>
                    )}

                    <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                      onMouseEnter={() => setHoveredMsgId(msg.id)}
                      onMouseLeave={() => setHoveredMsgId(null)}>

                      {/* Avatar (left side, only for others) */}
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-ig-card flex items-center justify-center overflow-hidden flex-shrink-0 mb-1">
                          {senderAvatar
                            ? <img src={senderAvatar} alt="" className="w-full h-full object-cover" />
                            : <span className="text-[10px] text-ig-text-secondary">{msg.senderUsername?.[0]?.toUpperCase()}</span>}
                        </div>
                      )}

                      {/* Action buttons on hover (left of own messages) */}
                      {hoveredMsgId === msg.id && isOwn && (
                        <div className="flex items-center gap-0.5 mb-1">
                          <button onClick={() => setReplyTo(msg)} className="p-1.5 hover:bg-white/10 rounded-full transition-smooth text-ig-text-secondary hover:text-ig-text" title="Reply">
                            <FiCornerUpLeft className="text-sm" />
                          </button>
                          <button data-reaction-trigger={msg.id} onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)} className="p-1.5 hover:bg-white/10 rounded-full transition-smooth text-ig-text-secondary hover:text-ig-text" title="React">
                            <span className="text-sm">😀</span>
                          </button>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className="relative max-w-[60%]">
                        {/* Username (only for group, others' messages, above bubble) */}
                        {isGroup && !isOwn && (
                          <p className="text-[11px] text-ig-text-secondary font-semibold mb-1 ml-1">{msg.senderUsername}</p>
                        )}

                        <div className={`px-4 py-2.5 rounded-2xl text-[14px] ${
                          isOwn ? 'bg-gradient-to-r from-ig-primary to-ig-purple text-white rounded-br-md'
                            : 'bg-ig-card text-ig-text rounded-bl-md'
                        }`}>
                          {msg.content}
                        </div>

                        {/* Reaction display */}
                        {msg.reaction && (
                          <span className="absolute -bottom-2 left-2 text-sm bg-ig-card border border-ig-border rounded-full px-1 shadow-lg cursor-pointer"
                            onClick={() => handleReaction(msg.id, msg.reaction)}>
                            {msg.reaction}
                          </span>
                        )}

                        {/* Seen indicator for own messages */}
                        {isLastOwn && !isGroup && (
                          <div className="flex justify-end mt-0.5 pr-1">
                            {msg.isRead ? (
                              <span className="text-ig-primary text-[10px] flex items-center gap-0.5"><FiCheckCircle /> Seen</span>
                            ) : (
                              <span className="text-ig-text-secondary text-[10px] flex items-center gap-0.5"><FiCheck /> Sent</span>
                            )}
                          </div>
                        )}

                        {/* Reaction picker (positioned above bubble, stays open on click) */}
                        {reactionPickerMsgId === msg.id && (
                          <div data-reaction-picker className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-10 bg-ig-card border border-ig-border rounded-full px-2 py-1.5 flex gap-1 shadow-xl z-50`}>
                            {REACTIONS.map((r) => (
                              <button key={r} onClick={() => handleReaction(msg.id, r)}
                                className="hover:scale-125 transition-transform text-base px-0.5 cursor-pointer">{r}</button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action buttons on hover (right of others' messages) */}
                      {hoveredMsgId === msg.id && !isOwn && (
                        <div className="flex items-center gap-0.5 mb-1">
                          <button onClick={() => setReplyTo(msg)} className="p-1.5 hover:bg-white/10 rounded-full transition-smooth text-ig-text-secondary hover:text-ig-text" title="Reply">
                            <FiCornerUpLeft className="text-sm" />
                          </button>
                          <button data-reaction-trigger={msg.id} onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)} className="p-1.5 hover:bg-white/10 rounded-full transition-smooth text-ig-text-secondary hover:text-ig-text" title="React">
                            <span className="text-sm">😀</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply bar */}
            {replyTo && (
              <div className="px-4 py-2 border-t border-ig-border/50 bg-ig-dark/50 flex items-center justify-between">
                <div className="text-xs text-ig-text-secondary flex items-center gap-1.5">
                  <FiCornerUpLeft />
                  Replying to <span className="font-semibold text-ig-text">{replyTo.senderUsername}</span>: {truncate(replyTo.content, 50)}
                </div>
                <button onClick={() => setReplyTo(null)} className="text-ig-text-secondary hover:text-ig-text transition-smooth"><IoClose /></button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-ig-border">
              <div className="flex items-center gap-2 bg-ig-card border border-ig-border rounded-full px-5 py-2.5">
                <input type="text" placeholder="Message..." value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="flex-1 bg-transparent text-sm focus:outline-none text-ig-text placeholder-ig-text-secondary" />
                <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                  className="text-ig-primary hover:text-ig-primary-dark transition-smooth disabled:opacity-30"><IoSend className="text-xl" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-ig-text-secondary">
            <div className="w-24 h-24 rounded-full border-2 border-ig-text-secondary/50 flex items-center justify-center mb-5">
              <IoPaperPlaneOutline className="text-4xl" />
            </div>
            <h3 className="text-xl font-light mb-1">Your Messages</h3>
            <p className="text-sm mb-5">Send a message to start a chat.</p>
            <button onClick={() => setShowNewChat(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-ig-primary to-ig-purple text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-smooth">
              Send Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectPage;
