import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { IoSend } from 'react-icons/io5';
import { FiSearch, FiEdit, FiUsers } from 'react-icons/fi';

const DirectPage = () => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // New conversation search
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Group chat
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('direct');

  // Load conversations and groups from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, groupRes] = await Promise.all([
          api.get('/chat/conversations'),
          api.get('/groups'),
        ]);
        setConversations(convRes.data);
        setGroups(groupRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle navigation state (from Profile "Message" button)
  useEffect(() => {
    if (location.state?.startChatWith) {
      const chatUser = location.state.startChatWith;
      setSelectedUser({ id: chatUser.id, username: chatUser.username, avatarUrl: chatUser.avatarUrl, fullName: chatUser.fullName });
      setSelectedGroup(null);
      setConversations((prev) => {
        if (prev.find((c) => c.id === chatUser.id)) return prev;
        return [{ id: chatUser.id, username: chatUser.username, avatarUrl: chatUser.avatarUrl, fullName: chatUser.fullName || '' }, ...prev];
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Subscribe to incoming 1-on-1 messages
  useEffect(() => {
    if (!connected || !user) return;
    const sub = subscribe('/user/queue/messages', (message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [connected, user, subscribe]);

  // Subscribe to group messages
  useEffect(() => {
    if (!connected || !selectedGroup) return;
    const sub = subscribe(`/topic/group.${selectedGroup.id}`, (message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [connected, selectedGroup, subscribe]);

  // Fetch message history
  useEffect(() => {
    if (selectedUser) {
      api.get(`/chat/messages/${selectedUser.id}`)
        .then((res) => setMessages(res.data))
        .catch((err) => console.error('Failed to fetch messages:', err));
    } else if (selectedGroup) {
      api.get(`/chat/group/${selectedGroup.id}`)
        .then((res) => setMessages(res.data))
        .catch((err) => console.error('Failed to fetch group messages:', err));
    }
  }, [selectedUser, selectedGroup]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message via REST API
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    if (!selectedUser && !selectedGroup) return;

    const content = newMessage;
    setNewMessage('');
    setSending(true);

    const tempMsg = {
      id: `temp-${Date.now()}`,
      senderId: user?.id,
      senderUsername: user?.username,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const payload = selectedGroup
        ? { content, isGroup: true, groupId: String(selectedGroup.id), receiverId: null }
        : { content, isGroup: false, groupId: null, receiverId: selectedUser.id };

      const res = await api.post('/chat/send', payload);
      setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? res.data : m));
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Search users for new 1-on-1 chat
  const handleUserSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setSearchResults(res.data.filter((u) => u.id !== user?.id));
    } catch (err) { console.error(err); }
  };

  const startConversation = (searchUser) => {
    setSelectedUser({ id: searchUser.id, username: searchUser.username, avatarUrl: searchUser.avatarUrl, fullName: searchUser.fullName });
    setSelectedGroup(null);
    setConversations((prev) => {
      if (prev.find((c) => c.id === searchUser.id)) return prev;
      return [{ id: searchUser.id, username: searchUser.username, avatarUrl: searchUser.avatarUrl, fullName: searchUser.fullName || '' }, ...prev];
    });
    setShowNewChat(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Group creation - search members
  const handleGroupSearch = async (q) => {
    setGroupSearchQuery(q);
    if (q.length < 2) { setGroupSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setGroupSearchResults(res.data.filter((u) => u.id !== user?.id && !groupMembers.find((m) => m.id === u.id)));
    } catch (err) { console.error(err); }
  };

  const addGroupMember = (u) => {
    setGroupMembers((prev) => [...prev, u]);
    setGroupSearchQuery('');
    setGroupSearchResults([]);
  };

  const removeGroupMember = (id) => {
    setGroupMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const createGroup = async () => {
    if (!groupName.trim() || groupMembers.length === 0) return;
    try {
      const res = await api.post('/groups', {
        name: groupName,
        memberIds: groupMembers.map((m) => m.id),
      });
      setGroups((prev) => [res.data, ...prev]);
      setSelectedGroup(res.data);
      setSelectedUser(null);
      setActiveTab('groups');
      setShowCreateGroup(false);
      setGroupName('');
      setGroupMembers([]);
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const chatTarget = selectedUser || selectedGroup;
  const chatName = selectedUser ? selectedUser.username : selectedGroup?.name;

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)] flex border border-ig-border rounded-xl overflow-hidden mt-4 mx-4 fade-in">
      {/* Sidebar */}
      <div className="w-80 border-r border-ig-border flex flex-col bg-ig-darker">
        <div className="p-4 border-b border-ig-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">{user?.username}</h2>
            <p className="text-ig-text-secondary text-xs mt-0.5">Messages</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowCreateGroup(!showCreateGroup); setShowNewChat(false); }}
              className="text-ig-text-secondary hover:text-ig-text transition-smooth" title="New group">
              <FiUsers className="text-lg" />
            </button>
            <button onClick={() => { setShowNewChat(!showNewChat); setShowCreateGroup(false); }}
              className="text-ig-text-secondary hover:text-ig-text transition-smooth" title="New conversation">
              <FiEdit className="text-xl" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ig-border text-sm">
          <button onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2 text-center transition-smooth ${activeTab === 'direct' ? 'text-ig-text border-b-2 border-ig-text' : 'text-ig-text-secondary'}`}>
            Direct
          </button>
          <button onClick={() => setActiveTab('groups')}
            className={`flex-1 py-2 text-center transition-smooth ${activeTab === 'groups' ? 'text-ig-text border-b-2 border-ig-text' : 'text-ig-text-secondary'}`}>
            Groups ({groups.length})
          </button>
        </div>

        {/* New Chat Search */}
        {showNewChat && (
          <div className="p-3 border-b border-ig-border">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-secondary text-sm" />
              <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => handleUserSearch(e.target.value)} autoFocus
                className="w-full bg-ig-card border border-ig-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-ig-primary transition-smooth placeholder-ig-text-secondary" />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto">
                {searchResults.map((u) => (
                  <button key={u.id} onClick={() => startConversation(u)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-ig-card rounded-lg transition-smooth">
                    <div className="w-9 h-9 rounded-full bg-ig-card border border-ig-border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-sm text-ig-text-secondary">{u.username?.[0]?.toUpperCase()}</span>}
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
          <div className="p-3 border-b border-ig-border space-y-2">
            <input type="text" placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-ig-card border border-ig-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ig-primary transition-smooth placeholder-ig-text-secondary" />
            {groupMembers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {groupMembers.map((m) => (
                  <span key={m.id} className="bg-ig-primary/20 text-ig-primary text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {m.username}
                    <button onClick={() => removeGroupMember(m.id)} className="hover:text-white">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ig-text-secondary text-sm" />
              <input type="text" placeholder="Add members..." value={groupSearchQuery} onChange={(e) => handleGroupSearch(e.target.value)}
                className="w-full bg-ig-card border border-ig-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-ig-primary transition-smooth placeholder-ig-text-secondary" />
            </div>
            {groupSearchResults.length > 0 && (
              <div className="max-h-32 overflow-y-auto">
                {groupSearchResults.map((u) => (
                  <button key={u.id} onClick={() => addGroupMember(u)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-ig-card rounded-lg text-sm transition-smooth">
                    <span>{u.username}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={createGroup} disabled={!groupName.trim() || groupMembers.length === 0}
              className="w-full py-2 bg-gradient-to-r from-ig-primary to-ig-purple text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-smooth disabled:opacity-40">
              Create Group
            </button>
          </div>
        )}

        {/* Conversation / Group Lists */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'direct' ? (
            <>
              {loading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-ig-primary"></div></div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-ig-text-secondary text-sm mb-3">No conversations yet</p>
                  <button onClick={() => setShowNewChat(true)} className="text-ig-primary text-sm font-semibold">Start a conversation</button>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button key={conv.id} onClick={() => { setSelectedUser(conv); setSelectedGroup(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-ig-card transition-smooth ${selectedUser?.id === conv.id ? 'bg-ig-card' : ''}`}>
                    <div className="w-12 h-12 rounded-full bg-ig-card border border-ig-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {conv.avatarUrl ? <img src={conv.avatarUrl} alt={conv.username} className="w-full h-full object-cover" /> : <span className="text-lg text-ig-text-secondary">{conv.username?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-sm truncate">{conv.username}</p>
                      <p className="text-ig-text-secondary text-xs truncate">{conv.fullName}</p>
                    </div>
                  </button>
                ))
              )}
            </>
          ) : (
            <>
              {groups.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-ig-text-secondary text-sm mb-3">No groups yet</p>
                  <button onClick={() => setShowCreateGroup(true)} className="text-ig-primary text-sm font-semibold">Create a group</button>
                </div>
              ) : (
                groups.map((g) => (
                  <button key={g.id} onClick={() => { setSelectedGroup(g); setSelectedUser(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-ig-card transition-smooth ${selectedGroup?.id === g.id ? 'bg-ig-card' : ''}`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ig-primary to-ig-purple flex items-center justify-center flex-shrink-0">
                      <FiUsers className="text-white text-lg" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-sm truncate">{g.name}</p>
                      <p className="text-ig-text-secondary text-xs truncate">{g.members?.length || 0} members</p>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-ig-dark">
        {chatTarget ? (
          <>
            <div className="p-4 border-b border-ig-border flex items-center gap-3">
              {selectedGroup ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ig-primary to-ig-purple flex items-center justify-center">
                  <FiUsers className="text-white text-sm" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-ig-card flex items-center justify-center overflow-hidden">
                  {selectedUser?.avatarUrl ? <img src={selectedUser.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">{selectedUser?.username?.[0]?.toUpperCase()}</span>}
                </div>
              )}
              <div>
                <span className="font-semibold text-sm">{chatName}</span>
                {selectedGroup && (
                  <p className="text-ig-text-secondary text-xs">{selectedGroup.members?.map((m) => m.username).join(', ')}</p>
                )}
              </div>
              {connected ? <span className="w-2 h-2 rounded-full bg-green-500 ml-auto" title="Connected"></span>
                         : <span className="w-2 h-2 rounded-full bg-yellow-500 ml-auto" title="Reconnecting..."></span>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-10 text-ig-text-secondary text-sm">No messages yet. Say hi! 👋</div>
              )}
              {messages.map((msg, idx) => {
                const isOwn = msg.senderId === user?.id;
                return (
                  <div key={msg.id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {!isOwn && selectedGroup && (
                      <span className="text-xs text-ig-text-secondary mr-2 self-end mb-1">{msg.senderUsername}</span>
                    )}
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                      isOwn ? 'bg-gradient-to-r from-ig-primary to-ig-purple text-white rounded-br-md' : 'bg-ig-card text-ig-text rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-ig-border">
              <div className="flex items-center gap-2 bg-ig-card border border-ig-border rounded-full px-4 py-2">
                <input id="chat-input" type="text" placeholder="Message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress}
                  className="flex-1 bg-transparent text-sm focus:outline-none text-ig-text placeholder-ig-text-secondary" />
                <button id="chat-send-button" onClick={handleSend} disabled={!newMessage.trim() || sending}
                  className="text-ig-primary hover:text-ig-primary-dark transition-smooth disabled:opacity-30">
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
            <p className="text-sm mb-4">Send private messages or create a group</p>
            <div className="flex gap-3">
              <button onClick={() => setShowNewChat(true)}
                className="px-5 py-2 bg-gradient-to-r from-ig-primary to-ig-purple text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-smooth">
                Send Message
              </button>
              <button onClick={() => { setShowCreateGroup(true); setActiveTab('groups'); }}
                className="px-5 py-2 bg-ig-card border border-ig-border rounded-lg text-sm font-semibold hover:bg-ig-border transition-smooth">
                Create Group
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectPage;
