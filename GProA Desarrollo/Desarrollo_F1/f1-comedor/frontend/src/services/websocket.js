import { useEffect, useRef, useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Custom hook for WebSocket connections
 * @param {string} channel - Channel name (scanner, dashboard, admin)
 * @param {function} onMessage - Callback for incoming messages
 */
export function useWebSocket(channel, onMessage) {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${API_URL.replace('http', 'ws')}/ws/${channel}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log(`[WebSocket] Connected to ${channel}`);
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`[WebSocket] Disconnected from ${channel}`, event.code);
        setIsConnected(false);
        
        // Auto-reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`[WebSocket] Error on ${channel}:`, error);
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [channel, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  };
}

/**
 * Hook specifically for dashboard real-time updates
 */
export function useDashboardUpdates(onNewConsumption) {
  return useWebSocket('dashboard', (message) => {
    if (message.type === 'new_consumption' && onNewConsumption) {
      onNewConsumption(message.data);
    }
  });
}

/**
 * Hook specifically for scanner real-time feedback
 */
export function useScannerUpdates(onStatusUpdate) {
  return useWebSocket('scanner', (message) => {
    if (message.type === 'scan_result' && onStatusUpdate) {
      onStatusUpdate(message.data);
    }
  });
}

export default useWebSocket;