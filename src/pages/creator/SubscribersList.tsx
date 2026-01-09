import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { Check, User, X } from 'lucide-react';

interface Subscription {
    id: string;
    consumer_email: string;
    status: string;
    proof_tx_hash: string | null;
    created_at: string;
    current_period_end: string;
}

export default function SubscribersList() {
    const [subscribers, setSubscribers] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING'>('ALL');

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        try {
            const res = await api.get('/subscriptions/subscribers');
            setSubscribers(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load subscribers');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (subId: string) => {
        try {
            await api.post(`/subscriptions/${subId}/approve`);
            toast.success('Subscription approved');
            fetchSubscribers(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error('Failed to approve subscription');
        }
    };

    const handleReject = async (subId: string) => {
        if (!window.confirm("Are you sure you want to reject this subscription?")) return;
        try {
            await api.post(`/subscriptions/${subId}/reject`);
            toast.success('Subscription rejected');
            fetchSubscribers();
        } catch (error) {
            console.error(error);
            toast.error('Failed to reject subscription');
        }
    };

    const filteredSubscribers = filter === 'ALL' ? subscribers : subscribers.filter(s => s.status === 'pending_review');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Subscribers</h1>
            <div className="flex space-x-2">
                <Button
                    variant={filter === 'ALL' ? 'default' : 'outline'}
                    onClick={() => setFilter('ALL')}
                >
                    All Subscribers
                </Button>
                <Button
                    variant={filter === 'PENDING' ? 'default' : 'outline'}
                    onClick={() => setFilter('PENDING')}
                >
                    Pending Review
                    {subscribers.filter(s => s.status === 'pending_review').length > 0 && (
                        <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                            {subscribers.filter(s => s.status === 'pending_review').length}
                        </span>
                    )}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center">Loading...</div>
                    ) : filteredSubscribers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No subscribers found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Proof</th>
                                        <th className="px-6 py-3">Joined</th>
                                        <th className="px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubscribers.map((sub) => (
                                        <tr key={sub.id} className="bg-white border-b">
                                            <td className="px-6 py-4 font-medium text-gray-900 flex items-center space-x-2">
                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <span>{sub.consumer_email || 'Unknown User'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <BadgeStatus status={sub.status} />
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {sub.proof_tx_hash ? (
                                                    <span className="text-blue-600 truncate max-w-[100px] block" title={sub.proof_tx_hash}>
                                                        {sub.proof_tx_hash.substring(0, 10)}...
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(sub.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {sub.status === 'pending_review' && (
                                                    <div className="flex space-x-2">
                                                        <Button size="sm" onClick={() => handleApprove(sub.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                            <Check className="mr-2 h-3 w-3" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleReject(sub.id)}>
                                                            <X className="mr-2 h-3 w-3" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function BadgeStatus({ status }: { status: string }) {
    switch (status) {
        case 'active': return <Badge variant="success">Active</Badge>;
        case 'pending_payment': return <Badge variant="secondary">Pending Payment</Badge>;
        case 'pending_review': return <Badge variant="warning">Review Needed</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}