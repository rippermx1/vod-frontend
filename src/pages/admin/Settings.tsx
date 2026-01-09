import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Shield, Hammer, Activity } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

interface AuditLog {
    id: string;
    action: string;
    user_id: string;
    target_type: string;
    target_id: string;
    created_at: string;
    metadata_json: any;
}

export default function AdminSettings() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchData();
        // Poll for updates every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [logsRes, settingsRes] = await Promise.all([
                api.get('/admin/audit-logs'),
                api.get('/admin/settings')
            ]);
            setLogs(logsRes.data);

            // Convert list to map
            const settingsMap: Record<string, string> = {};
            settingsRes.data.forEach((s: any) => settingsMap[s.key] = s.value);
            setSettings(settingsMap);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMaintenance = async () => {
        const currentMode = settings['maintenance_mode'] === 'true';
        const newMode = !currentMode;

        if (!confirm(`Are you sure you want to turn Maintenance Mode ${newMode ? 'ON' : 'OFF'}?`)) return;

        try {
            await api.put('/admin/settings/maintenance_mode', {
                value: newMode.toString(),
                description: "Global system maintenance mode"
            });
            setSettings({ ...settings, maintenance_mode: newMode.toString() });
            toast.success(`Maintenance Mode turned ${newMode ? 'ON' : 'OFF'} `);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update settings");
        }
    };

    const isMaintenanceMode = settings['maintenance_mode'] === 'true';

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">System Settings & Logs</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center space-x-2">
                        <Hammer className="h-5 w-5 text-primary" />
                        <CardTitle>Maintenance Mode</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
                            <div>
                                <div className="font-semibold text-foreground">System Status</div>
                                <div className="text-sm text-muted-foreground">Force offline mode for non-admins</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={isMaintenanceMode ? 'destructive' : 'success'}>
                                    {isMaintenanceMode ? 'Maintenance' : 'Online'}
                                </Badge>
                                <Button
                                    variant={isMaintenanceMode ? "secondary" : "destructive"}
                                    size="sm"
                                    onClick={handleToggleMaintenance}
                                >
                                    {isMaintenanceMode ? "Turn Off" : "Turn On"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center space-x-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <CardTitle>Security</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Global security settings and rate limiting configuration.
                            (Coming Soon)
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center space-x-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle>Audit Logs (Last 50)</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Loading logs...</div>
                    ) : (
                        <div className="rounded-md border border-border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="p-3 font-medium text-muted-foreground">Action</th>
                                        <th className="p-3 font-medium text-muted-foreground">Target</th>
                                        <th className="p-3 font-medium text-muted-foreground">Time</th>
                                        <th className="p-3 font-medium text-muted-foreground">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                                            <td className="p-3">
                                                <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-foreground">{log.target_type}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{log.target_id?.slice(0, 8)}...</div>
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                <pre className="text-[10px] text-muted-foreground overflow-x-auto max-w-[200px]">
                                                    {JSON.stringify(log.metadata_json, null, 2)}
                                                </pre>
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-muted-foreground">No logs found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
