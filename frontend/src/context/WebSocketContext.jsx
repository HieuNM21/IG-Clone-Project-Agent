import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
};

const getWsUrl = () => {
  const host = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  return `${protocol}://${host}:8080/ws`;
};

export const WebSocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const clientRef = useRef(null);
  const subscriptionsRef = useRef([]);

  // Fetch initial notifications and unread count
  useEffect(() => {
    if (!isAuthenticated) return;

    api.get('/notifications')
      .then((res) => setNotifications(res.data || []))
      .catch(() => {});

    api.get('/notifications/unread-count')
      .then((res) => {
        const count = typeof res.data === 'number' ? res.data : (res.data?.count || 0);
        setUnreadCount(count);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setConnected(false);
      }
      return;
    }

    const wsUrl = getWsUrl();
    console.log('Connecting WebSocket to:', wsUrl);

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');
        setConnected(true);

        const notifSub = client.subscribe('/user/queue/notifications', (message) => {
          console.log('Notification received:', message.body);
          const notification = JSON.parse(message.body);
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        });
        subscriptionsRef.current.push(notifSub);
      },
      onDisconnect: () => { setConnected(false); },
      onStompError: (frame) => { console.error('STOMP error:', frame.headers['message']); },
      onWebSocketError: (event) => { console.error('WebSocket error:', event); },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];
      client.deactivate();
    };
  }, [isAuthenticated, user, token]);

  const subscribe = useCallback((destination, callback) => {
    if (clientRef.current && connected) {
      const sub = clientRef.current.subscribe(destination, (message) => {
        callback(JSON.parse(message.body));
      });
      subscriptionsRef.current.push(sub);
      return sub;
    }
    return null;
  }, [connected]);

  const sendMessage = useCallback((destination, body) => {
    if (clientRef.current && connected) {
      clientRef.current.publish({ destination, body: JSON.stringify(body) });
      return true;
    }
    return false;
  }, [connected]);

  // Mark ALL notifications as read
  const markNotificationsRead = useCallback(() => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    api.post('/notifications/mark-read').catch(() => {});
  }, []);

  // Mark a SINGLE notification as read (locally)
  const markOneNotificationRead = useCallback((notifId) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notifId && !n.isRead) {
          return { ...n, isRead: true };
        }
        return n;
      })
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        notifications,
        unreadCount,
        subscribe,
        sendMessage,
        markNotificationsRead,
        markOneNotificationRead,
        setUnreadCount,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
