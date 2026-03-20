/**
 * useWebSocket Hook - Real-time notifications for F1 Comedor
 * 
 * Provides WebSocket connection for real-time updates:
 * - New consumptions
 * - Employee scans
 * - Dashboard refresh
 * 
 * Usage:
 * const { lastMessage, isConnected } = useWebSocket();
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export function useWebSocket() {
    const [lastMessage, setLastMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);

            // Send subscription message
            ws.send(JSON.stringify({
                type: 'subscribe',
                events: ['consumption:new', 'employee:scan', 'dashboard:refresh']
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastMessage(data);

                // Handle different message types
                switch (data.type) {
                    case 'consumption:new':
                        console.log('New consumption:', data.data);
                        // Trigger notification or refresh
                        window.dispatchEvent(new CustomEvent('consumption:new', { detail: data.data }));
                        break;

                    case 'employee:scan':
                        console.log('Employee scanned:', data.data);
                        window.dispatchEvent(new CustomEvent('employee:scan', { detail: data.data }));
                        break;

                    case 'dashboard:refresh':
                        console.log('Dashboard refresh requested');
                        window.dispatchEvent(new CustomEvent('dashboard:refresh'));
                        break;

                    default:
                        break;
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);

            // Attempt to reconnect after 5 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('Attempting to reconnect WebSocket...');
                connect();
            }, 5000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        wsRef.current = ws;
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const sendMessage = useCallback((message) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected');
        }
    }, []);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        lastMessage,
        isConnected,
        sendMessage,
        connect,
        disconnect
    };
}

// Hook for consuming specific event types
export function useWebSocketEvent(eventType, callback) {
    const { lastMessage } = useWebSocket();

    useEffect(() => {
        if (lastMessage?.type === eventType) {
            callback(lastMessage.data);
        }
    }, [lastMessage, eventType, callback]);
}

export default useWebSocket;
