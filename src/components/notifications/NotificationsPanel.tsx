import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

import { useNotificationStream } from '../../hooks/useNotificationStream';

export function NotificationsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { notifications, markRead } = useNotificationStream();

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Notifications"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center border-2 border-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 border border-border overflow-hidden z-50">
                    <div className="p-4 border-b border-border flex justify-between items-center">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <p className="text-sm">No notifications yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 hover:bg-accent transition-colors",
                                            !notification.is_read ? "bg-primary/5" : ""
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <Info className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-sm font-medium", !notification.is_read ? "text-foreground" : "text-muted-foreground")}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-0.5 break-words">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground/60 mt-2">
                                                    {notification.created_at ? new Date(notification.created_at).toLocaleString() : ''}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markRead(notification.id)}
                                                    className="text-muted-foreground hover:text-primary p-1"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
