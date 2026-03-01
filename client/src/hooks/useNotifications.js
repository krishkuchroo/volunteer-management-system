import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useNotifications() {
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    function addNotification(notification) {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
    }

    socket.on('background-check-updated', ({ status }) => {
      addNotification({
        id: Date.now(),
        type: 'background-check-updated',
        message: `Your background check status changed to: ${status}`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('hours-approved', ({ hours, date }) => {
      addNotification({
        id: Date.now(),
        type: 'hours-approved',
        message: `${hours} hours on ${date} have been approved`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('volunteer-update', ({ type, status }) => {
      addNotification({
        id: Date.now(),
        type: 'volunteer-update',
        message: `Volunteer ${type.replace('-', ' ')} updated to: ${status}`,
        timestamp: new Date().toISOString(),
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  function markAllRead() {
    setUnreadCount(0);
  }

  return { notifications, unreadCount, markAllRead };
}
