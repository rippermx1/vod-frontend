import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Users, Video, DollarSign, Activity, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { toast } from 'sonner';

interface CreatorStats {
    total_subscribers: number;
    active_content: number;
    est_earnings: number;
    views: number;
    recent_subscribers: Array<{
        id: string;
        full_name: string;
        email: string;
        joined_at: string;
    }>;
    recent_content: Array<{
        id: string;
        title: string;
        status: string;
        published_at: string;
    }>;
}

export default function CreatorOverview() {
    const [statsData, setStatsData] = useState<CreatorStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/cms/dashboard/stats');
                setStatsData(res.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
                toast.error("Failed to load dashboard stats");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-emerald-500" /></div>;
    }

    const stats = [
        { name: 'Total Subscribers', value: statsData?.total_subscribers.toString() || '0', icon: Users, change: '+0', trend: 'neutral' },
        { name: 'Active Content', value: statsData?.active_content.toString() || '0', icon: Video, change: '+0', trend: 'neutral' },
        { name: 'Est. Earnings', value: `$${statsData?.est_earnings.toFixed(2) || '0.00'}`, icon: DollarSign, change: '+0%', trend: 'neutral' },
        { name: 'Views (30d)', value: statsData?.views.toString() || '0', icon: Activity, change: '+0%', trend: 'neutral' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.name}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.name}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-primary font-medium">{stat.change}</span> from last month
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsData?.recent_content && statsData.recent_content.length > 0 ? (
                            <div className="space-y-4">
                                {statsData.recent_content.map((item) => (
                                    <div key={item.id} className="flex items-center">
                                        <div className="bg-primary/10 p-2 rounded-full mr-4">
                                            <Video className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium leading-none">{item.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Published on {new Date(item.published_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-sm text-emerald-500 font-medium capitalize">
                                            {item.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No recent activity.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Subscribers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsData?.recent_subscribers && statsData.recent_subscribers.length > 0 ? (
                            <div className="space-y-4">
                                {statsData.recent_subscribers.map((sub) => (
                                    <div key={sub.id} className="flex items-center">
                                        <div className="h-9 w-9 bg-secondary rounded-full flex items-center justify-center mr-3">
                                            <span className="text-xs font-bold text-secondary-foreground">
                                                {sub.full_name?.substring(0, 2).toUpperCase() || 'AN'}
                                            </span>
                                        </div>
                                        <div className="ml-2 space-y-1">
                                            <p className="text-sm font-medium leading-none">{sub.full_name || 'Anonymous'}</p>
                                            <p className="text-xs text-muted-foreground">{sub.email}</p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs text-muted-foreground">
                                            {new Date(sub.joined_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No subscribers yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
