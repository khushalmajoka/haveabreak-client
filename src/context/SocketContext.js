import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

// Generate a stable ID once per browser — survives socket reconnects
function getStablePlayerId() {
  let id = localStorage.getItem('stablePlayerId');
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('stablePlayerId', id);
  }
  return id;
}

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const stableId = getStablePlayerId();

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, stableId }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
