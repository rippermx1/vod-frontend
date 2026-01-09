import { useEffect, useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { api } from '../../../api/client';
import type { User } from '../Users'; // Type-only import
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface UserDetail extends User {
    created_content_count: number;
    active_subscriptions_count: number;
    subscribers_count: number;
    total_spent_usdt: number;
    recent_logs: any[];
}

interface UserDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
}

export function UserDetailModal({ isOpen, onClose, userId }: UserDetailModalProps) {
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);

    // Edit Form State
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        role: 'consumer',
        plan_id: ''
    });

    useEffect(() => {
        if (isOpen && userId) {
            fetchDetails();
            fetchPlans();
            setIsEditing(false);
        } else {
            setUser(null);
        }
    }, [isOpen, userId]);

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                bio: user.bio || '',
                role: user.role,
                plan_id: user.plan_id || ''
            });
        }
    }, [user]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users/${userId}`);
            setUser(res.data);
        } catch (error) {
            console.error("Failed to fetch user details", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const res = await api.get('/admin/plans');
            setPlans(res.data);
        } catch (error) {
            console.error("Failed to fetch plans");
        }
    };

    const handleSave = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            await api.put(`/admin/users/${userId}`, {
                full_name: formData.full_name,
                bio: formData.bio,
                role: formData.role
            });

            // Handle Plan Change separately if changed
            if (formData.plan_id !== (user?.plan_id || '')) {
                await api.put(`/admin/users/${userId}/plan`, { plan_id: formData.plan_id || null });
            }

            // Refresh details
            await fetchDetails();
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            // toast.error("Failed to update user"); // Add toast if available
        } finally {
            setLoading(false);
        }
    };

    if (!userId) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit User" : "User Details"}
        >
            {loading && !user ? (
                <div className="p-8 text-center">Loading...</div>
            ) : user ? (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        {!isEditing ? (
                            <div>
                                <div className="text-xl font-bold">{user.full_name || 'No Name'}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                <div className="text-xs font-mono text-muted-foreground mt-1">{user.id}</div>
                            </div>
                        ) : (
                            <div className="w-full mr-4 space-y-2">
                                <input
                                    className="w-full p-2 border rounded bg-background"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Full Name"
                                />
                                <div className="text-sm text-muted-foreground">{user.email} (Read Only)</div>
                            </div>
                        )}

                        <div className="flex flex-col items-end gap-2">
                            {!isEditing ? (
                                <>
                                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'creator' ? 'default' : 'secondary'}>
                                        {user.role.toUpperCase()}
                                    </Badge>
                                    <Badge variant={user.is_active ? 'success' : 'destructive'}>
                                        {user.is_active ? 'ACTIVE' : 'BANNED'}
                                    </Badge>
                                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                                </>
                            ) : (
                                <select
                                    className="p-1 border rounded bg-background text-sm"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="consumer">Consumer</option>
                                    <option value="creator">Creator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Stats (Hide in Edit Mode? Or keep?) - Keep for context */}
                    {!isEditing && (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 bg-muted/50 rounded-lg text-center">
                                    <div className="text-2xl font-bold">{user.created_content_count}</div>
                                    <div className="text-xs text-muted-foreground">Posts Created</div>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg text-center">
                                    <div className="text-2xl font-bold">{user.active_subscriptions_count}</div>
                                    <div className="text-xs text-muted-foreground">Active Subs</div>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg text-center">
                                    <div className="text-2xl font-bold">{user.recent_logs.length}</div>
                                    <div className="text-xs text-muted-foreground">Recent Actions</div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Contact/Info */}
                    <div className="space-y-2 text-sm border-t border-border pt-4">
                        {!isEditing ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-3">
                                    <span className="text-muted-foreground">Bio:</span>
                                    <span className="col-span-2">{user.bio || '-'}</span>
                                </div>
                                {user.role === 'creator' && (
                                    <div className="grid grid-cols-3">
                                        <span className="text-muted-foreground">Current Plan:</span>
                                        <span className="col-span-2 font-medium">
                                            {plans.find(p => p.id === user.plan_id)?.name || (user.plan_id ? 'Unknown Plan' : 'Free / Trial')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-muted-foreground">Bio</label>
                                    <textarea
                                        className="w-full p-2 border rounded bg-background"
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                {(formData.role === 'creator' || user.role === 'creator') && (
                                    <div className="space-y-1">
                                        <label className="text-muted-foreground">SaaS Plan (Override)</label>
                                        <select
                                            className="w-full p-2 border rounded bg-background"
                                            value={formData.plan_id}
                                            onChange={e => setFormData({ ...formData, plan_id: e.target.value })}
                                        >
                                            <option value="">No Plan / Free</option>
                                            {plans.map(plan => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.name} (${plan.price_usdt})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-yellow-600">
                                            Warning: Changing this manually overrides any active subscription logic.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-3 pt-2">
                            <span className="text-muted-foreground">Joined:</span>
                            <span className="col-span-2">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Actions if Editing */}
                    {isEditing && (
                        <div className="flex justify-end gap-2 pt-4 border-t border-border">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={loading}>Save Changes</Button>
                        </div>
                    )}

                    {/* Activity Log - Hide in Edit */}
                    {!isEditing && (
                        <div className="space-y-2 border-t border-border pt-4">
                            <h4 className="font-semibold text-sm">Recent Activity</h4>
                            {user.recent_logs.length === 0 ? (
                                <div className="text-xs text-muted-foreground">No recent activity.</div>
                            ) : (
                                <div className="space-y-2">
                                    {user.recent_logs.map((log: any) => (
                                        <div key={log.id} className="text-xs flex justify-between p-2 bg-muted/30 rounded">
                                            <span className="font-mono">{log.action}</span>
                                            <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : null}
        </Modal>
    );
}
