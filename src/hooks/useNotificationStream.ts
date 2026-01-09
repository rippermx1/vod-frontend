
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { toast } from 'sonner';

export interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    resource_type?: string;
    resource_id?: string;
    created_at: string;
}

export function useNotificationStream() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [connected, setConnected] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchNotifications();
    }, []);

    // SSE Connection
    useEffect(() => {
        // Build URL with auth token if needed
        // Assuming cookie-based or handle token in URL?
        // Standard EventSource doesn't support headers easily.
        // Option 1: Pass token in query param.
        // Option 2: Use library 'event-source-polyfill' or 'fetch-event-source'.
        // MVP: Native EventSource + Token in Query Param (if API supports it) or Cookie.
        // Our API client uses axios interceptors. 
        // For simple MVP "Better Approach" while avoiding polyfill dependency hell for now:
        // We will assume backend accepts token in query `?token=...` OR we use a simple fetch recursive loop IF headers required.
        // BUT user asked for "Efficient", so SSE is best.
        // Let's use `fetch-event-source` pattern OR just standard EventSource if cookie is used.
        // Backend `Depends(get_current_active_user)` usually checks Header "Authorization: Bearer ...".
        // EventSource cannot send headers.

        // Quick Fix: Retrieve token from localStorage and append to URL.
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Note: Backend must accept token in query param for this to work natively?
        // OR we use a pollyfill.
        // Let's try native EventSource assuming we might need to adjust backend auth to look at query param temporarily 
        // OR (Better) use `fetch` with ReadableStream which supports headers.

        // Actually, `fetch` streaming is standard in modern browsers.

        let abortController = new AbortController();

        const connect = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${baseUrl}/notifications/stream`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    signal: abortController.signal
                });

                if (!response.ok) throw new Error("Stream connection failed");

                setConnected(true);
                const reader = response.body?.getReader();
                if (!reader) return;

                const decoder = new TextDecoder();

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    // Parse SSE format (data: ...)
                    // Chunk might contain multiple lines
                    const lines = chunk.split('\n\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.replace('data: ', '').trim();
                            try {
                                const notif = JSON.parse(dataStr);
                                handleNewNotification(notif);
                            } catch (e) {
                                console.error("Parse SSE error", e);
                            }
                        }
                    }
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error("SSE Error", error);
                    setConnected(false);
                    // Retry in 5s
                    setTimeout(connect, 5000);
                }
            }
        };

        connect();

        return () => {
            abortController.abort();
            setConnected(false);
        };
    }, []);

    const handleNewNotification = (notif: Notification) => {
        setNotifications(prev => [notif, ...prev]);
        setHasUnread(true);
        toast.info(notif.title, {
            description: notif.message
        });
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setHasUnread(res.data.some((n: any) => !n.is_read));
        } catch (error) {
            console.error(error);
        }
    };

    const markRead = async (id: string) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setHasUnread(notifications.some(n => n.id !== id && !n.is_read));
        } catch (error) {
            console.error(error);
        }
    };

    return { notifications, hasUnread, markRead, connected };
}
