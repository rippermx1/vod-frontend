import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import {
    LayoutDashboard,
    Video,
    Settings,
    LogOut,
    Menu,
    X,
    Users,
    Upload,
    ExternalLink,
    CreditCard,
    ShieldCheck,
    Image as ImageIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { NotificationsPanel } from '../components/notifications/NotificationsPanel';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const location = useLocation();
    const { user } = useAuth();

    // Define items based on role (MVP: Creator focus)
    const items = [
        { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
        { name: 'Content', to: '/creator/content', icon: Video },
        { name: 'Media Library', to: '/creator/media', icon: ImageIcon },
        { name: 'Upload', to: '/creator/upload', icon: Upload },
        { name: 'Subscribers', to: '/creator/subscribers', icon: Users },
        { name: 'My Page', to: '/creator/profile', icon: Users }, // Using Users icon temporarily or import User
        { name: 'Plans', to: '/creator/pricing', icon: CreditCard },
        { name: 'Verification', to: '/creator/kyc', icon: ShieldCheck },
        { name: 'Settings', to: '/creator/settings', icon: Settings },
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

                    <div className="pt-4 mt-4 border-t border-border">
                        <Link
                            to={`/creator/${user?.id}`}
                            target="_blank"
                            className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <ExternalLink className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                            Preview Profile
                        </Link>
                    </div>
                </nav>
            </div>
        </>
    );
}

import { useEffect } from 'react';
import { api } from '../api/client';
import { AlertTriangle } from 'lucide-react';

// ... (Sidebar code unchanged) ...

interface UserSubscription {
    status: string;
    expires_at: string | null;
    plan: {
        code: string;
        name: string;
    }
}

export function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);

    useEffect(() => {
        const fetchSub = async () => {
            try {
                const res = await api.get('/plans/me/subscription');
                setSubscription(res.data);
            } catch (err) {
                // Ignore 404 (no plan) - maybe also show alert?
                console.error("No active plan", err);
            }
        };
        fetchSub();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isExpired = subscription && (
        subscription.status !== 'active' ||
        (subscription.expires_at && new Date(subscription.expires_at) < new Date())
    );

    // If no subscription at all, maybe they are legacy or just registered without trial?
    // Assuming they should always have one now. If not, treat as unrestricted? 
    // Or treat as "Need Plan". Let's focus on "Expiring/Expired".

    return (
        <div className="flex h-screen overflow-hidden bg-muted/40">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 shadow-sm lg:px-8">
                    {/* ... (Header content) ... */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden -ml-2 p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="ml-auto flex items-center space-x-4">
                        <NotificationsPanel />
                        <span className="text-sm font-medium text-foreground">
                            {user?.full_name}
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                {/* Expiry Alert */}
                {isExpired && (
                    <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <span className="font-medium">
                                Your free trial has ended. Please upgrade your plan to continue using all features.
                            </span>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white text-red-600 hover:bg-gray-100"
                            onClick={() => navigate('/creator/pricing')}
                        >
                            Upgrade Now
                        </Button>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
