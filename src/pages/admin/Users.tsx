import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Search, Filter, Ban, CheckCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';

import { UserDetailModal } from './components/UserDetailModal';

export interface User { // Exporting interface for reuse
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'creator' | 'consumer';
    is_active: boolean;
    created_at: string;
    avatar_url?: string;
    bio?: string;
    plan_id?: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [detailUserId, setDetailUserId] = useState<string | null>(null);

    // Filters
    const [roleFilter, setRoleFilter] = useState<'all' | 'creator' | 'consumer'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (user: User) => {
        if (!confirm(`Are you sure you want to ${user.is_active ? 'BAN' : 'UNBAN'} ${user.email}?`)) return;

        try {
            const newStatus = !user.is_active;
            await api.patch(`/admin/users/${user.id}/status?is_active=${newStatus}`);

            // Optimistic update
            setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
            toast.success(`User ${newStatus ? 'activated' : 'banned'} successfully`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update user status");
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all'
            ? true
            : statusFilter === 'active' ? user.is_active
                : !user.is_active;

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 max-w-sm"
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as any)}
                            >
                                <option value="all">All Roles</option>
                                <option value="creator">Creator</option>
                                <option value="consumer">Viewer</option>
                            </select>

                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="banned">Banned</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <div className="rounded-md border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-border bg-muted/50">
                                        <tr className="text-left">
                                            <th className="p-4 font-medium text-muted-foreground">User</th>
                                            <th className="p-4 font-medium text-muted-foreground">Role</th>
                                            <th className="p-4 font-medium text-muted-foreground">Status</th>
                                            <th className="p-4 font-medium text-muted-foreground">Joined</th>
                                            <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-foreground">{user.full_name || 'No Name'}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'creator' ? 'default' : 'secondary'}>
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant={user.is_active ? 'success' : 'destructive'} className={!user.is_active ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}>
                                                        {user.is_active ? 'Active' : 'Banned'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-right flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDetailUserId(user.id)}
                                                    >
                                                        Details
                                                    </Button>

                                                    {user.role !== 'admin' && (
                                                        <Button
                                                            variant={user.is_active ? "destructive" : "secondary"}
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleStatus(user);
                                                            }}
                                                            className="h-8"
                                                        >
                                                            {user.is_active ? (
                                                                <>
                                                                    <Ban className="h-3 w-3 mr-1" /> Ban
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="h-3 w-3 mr-1" /> Unban
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                    No users found matching your filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <UserDetailModal
                isOpen={!!detailUserId}
                userId={detailUserId}
                onClose={() => setDetailUserId(null)}
            />
        </div>
    );
}
