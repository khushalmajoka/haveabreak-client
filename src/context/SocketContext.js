import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import logger from "../utils/logger";

const SocketContext = createContext(null);

// Generate a stable ID once per browser — survives socket reconnects
function getStablePlayerId() {
  let id = localStorage.getItem("stablePlayerId");
  if (!id) {
    id =
      "p_" +
      Math.random().toString(36).substring(2, 11) +
      Date.now().toString(36);
    localStorage.setItem("stablePlayerId", id);
    logger.info("Generated new stablePlayerId", { id });
  } else {
    logger.debug("Loaded stablePlayerId from localStorage", { id });
  }
  return id;
}

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const stableId = getStablePlayerId();

  useEffect(() => {
    const SOCKET_URL =
      process.env.REACT_APP_SERVER_URL || "http://localhost:5000";
    logger.info("Connecting to socket server", { url: SOCKET_URL });

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      setConnected(true);
      logger.info("Socket connected", {
        socketId: socketRef.current.id,
        stableId,
      });
    });

    socketRef.current.on("disconnect", (reason) => {
      setConnected(false);
      logger.warn("Socket disconnected", { reason });
    });

    socketRef.current.on("connect_error", (err) => {
      logger.error("Socket connection error", { message: err.message });
    });

    socketRef.current.on("reconnect", (attempt) => {
      logger.info("Socket reconnected", {
        attempt,
        newSocketId: socketRef.current.id,
      });

      // After reconnect, notify any active game page so it can rejoin the room.
      // We fire a custom DOM event — game pages listen for this and emit
      // the appropriate rejoin socket event with their roomCode + stableId.
      window.dispatchEvent(new CustomEvent("socket:reconnected"));
    });

    socketRef.current.on("reconnect_attempt", (attempt) => {
      logger.debug("Socket reconnect attempt", { attempt });
    });

    // Intercept ALL incoming events for tracing
    socketRef.current.onAny((event, ...args) => {
      logger.socket.on(event, args[0]);
    });

    return () => {
      logger.info("Disconnecting socket");
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, connected, stableId }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
