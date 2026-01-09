import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import {
    Compass,
    LogOut,
    Menu,
    X,
    Heart,
    CreditCard,
    Settings
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { NotificationsPanel } from '../components/notifications/NotificationsPanel';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const location = useLocation();

    const items = [
        { name: 'Explore', to: '/explore', icon: Compass },
        { name: 'Subscriptions', to: '/subscriptions', icon: Heart },
        { name: 'Payments', to: '/payments', icon: CreditCard },
        { name: 'Settings', to: '/settings', icon: Settings },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-gray-900/50 lg:hidden",
                    isOpen ? "block" : "hidden"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-4 border-b border-border">
                    <span className="text-xl font-bold text-primary">VOD SaaS</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-1 rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-4 space-y-1 px-2">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.to;
                        return (
                            <Link
                                key={item.name}
                                to={item.to}
                                className={cn(
                                    "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Icon className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}

export function ConsumerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-muted/40">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 shadow-sm lg:px-8">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden -ml-2 p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* Simple Search Placeholder */}
                    <div className="flex-1 max-w-lg mx-4">
                        <input
                            type="text"
                            placeholder="Search creators..."
                            className="w-full rounded-md border border-input bg-secondary/50 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>

                    <div className="ml-auto flex items-center space-x-4">
                        <NotificationsPanel />
                        <span className="text-sm font-medium text-foreground">
                            {user?.full_name || user?.email}
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
