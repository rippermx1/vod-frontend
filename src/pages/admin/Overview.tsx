import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Users, DollarSign, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserDetailModal } from './components/UserDetailModal';

interface AdminStats {
    total_users: number;
    total_creators: number;
    total_consumers: number;
    pending_kyc: number;
    pending_payments: number;
    revenue_total_usdt: number;
}

export default function AdminOverview() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [detailUserId, setDetailUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, logsRes, usersRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/audit-logs?limit=5'),
                api.get('/admin/users')
            ]);
            setStats(statsRes.data);
            setLogs(logsRes.data);
            setRecentUsers(usersRes.data.slice(0, 5));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load dashboard data");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-slate-600" /></div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats?.revenue_total_usdt.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">+0% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_users}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.total_creators} Creators, {stats?.total_consumers} Consumers
                        </p>
                    </CardContent>
                </Card>
                <Card className={stats?.pending_kyc ? "border-yellow-400 bg-yellow-50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
                        <ShieldAlert className={`h-4 w-4 ${stats?.pending_kyc ? "text-yellow-600" : "text-gray-400"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pending_kyc}</div>
                        <p className="text-xs text-muted-foreground"> creators waiting for review</p>
                    </CardContent>
                </Card>
                <Card className={stats?.pending_payments ? "border-blue-400 bg-blue-50" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <CheckCircle className={`h-4 w-4 ${stats?.pending_payments ? "text-blue-600" : "text-gray-400"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pending_payments}</div>
                        <p className="text-xs text-muted-foreground"> manual payments to confirm</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="h-[400px]">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {logs.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No recent activity.</div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex flex-col space-y-1 border-b border-border pb-2 last:border-0">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-mono font-medium">{log.action}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            Target: {log.target_type} ({log.target_id})
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="h-[400px]">
                    <CardHeader>
                        <CardTitle>New Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentUsers.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No users found.</div>
                        ) : (
                            <div className="space-y-4">
                                {recentUsers.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                                        <div className="overflow-hidden">
                                            <div className="font-medium truncate">{u.full_name || 'No Name'}</div>
                                            <div className="text-xs text-muted-foreground">{u.email}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground mt-0.5">{u.role}</div>
                                        </div>
                                        <button onClick={() => setDetailUserId(u.id)} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition">
                                            Manage
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <UserDetailModal isOpen={!!detailUserId} userId={detailUserId} onClose={() => setDetailUserId(null)} />
        </div>
    );
}