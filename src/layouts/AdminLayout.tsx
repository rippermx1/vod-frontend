import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, LogOut, ShieldCheck, Settings, UserCheck } from 'lucide-react';

export function AdminLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-muted/40 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border flex flex-col text-card-foreground">
                <div className="p-6 border-b border-border">
                    <Link to="/admin" className="flex items-center space-x-2">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">VOD Admin</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/admin">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start ${isActive('/admin') ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}`}
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Overview
                        </Button>
                    </Link>
                    <Link to="/admin/users">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start ${isActive('/admin/users') ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}`}
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Users
                        </Button>
                    </Link>
                    <Link to="/admin/kyc">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start ${isActive('/admin/kyc') ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}`}
                        >
                            <UserCheck className="mr-2 h-4 w-4" />
                            KYC Review
                        </Button>
                    </Link>
                    <Link to="/admin/plans">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start ${isActive('/admin/plans') ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}`}
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Plans
                        </Button>
                    </Link>
                    <Link to="/admin/settings">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start ${isActive('/admin/settings') ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}`}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Button>
                    </Link>
                    <Link to="/admin/payments">
                        <Button
                            variant="ghost"
                            className={`w-full justify-start ${isActive('/admin/payments') ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}`}
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Payments
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center mr-2">
                            <span className="font-bold text-xs text-secondary-foreground">AD</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-foreground truncate">{user?.full_name || 'Admin'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
