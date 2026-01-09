import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Loader2, Zap, ExternalLink, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Subscription {
    id: string;
    consumer_id: string;
    creator_id: string;
    creator_email?: string;
    creator_name?: string;
    creator_avatar_url?: string;
    status: string;
    proof_tx_hash?: string;
    current_period_end: string;
    created_at: string;
    new_posts_count: number;
    monthly_price?: number;
}

export default function SubscriptionsList() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Payment Modal State
    const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
    const [txHash, setTxHash] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<{ type: string, details: string } | null>(null);

    // Simulation State
    const [simulatingId, setSimulatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/subscriptions/me');
            setSubscriptions(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load subscriptions');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayClick = (sub: Subscription) => {
        setSelectedSub(sub);
        setTxHash('');
        setPaymentMethod({
            type: 'USDT (TRC20)',
            details: 'T9yD14Nj9... (Ask Creator)'
        });
    };

    const handleSimulatePayment = async (sub: Subscription) => {
        if (!confirm("Simulate successful payment for local testing?")) return;
        setSimulatingId(sub.id);
        try {
            await api.post(`/subscriptions/${sub.id}/simulate-payment`);
            toast.success("Payment simulated! Subscription active.");
            fetchSubscriptions();
        } catch (error) {
            console.error(error);
            toast.error("Failed to simulate payment");
        } finally {
            setSimulatingId(null);
        }
    };

    const submitProof = async () => {
        if (!selectedSub || !txHash) return;
        setSubmitting(true);
        try {
            await api.post(`/subscriptions/${selectedSub.id}/proof`, {
                tx_hash: txHash
            });
            toast.success("Payment proof submitted for review");
            setSelectedSub(null);
            fetchSubscriptions();
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit proof");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
            case 'PENDING_PAYMENT':
                return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><AlertCircle className="w-3 h-3 mr-1" /> Unpaid</Badge>;
            case 'PENDING_REVIEW':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> In Review</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive">Rejected</Badge>;
            case 'EXPIRED':
                return <Badge variant="outline" className="text-gray-500">Expired</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getAvatarSrc = (url?: string) => {
        if (!url) return undefined;
        if (url.startsWith('http') || url.startsWith('/')) return url;
        // Fallback for local/relative paths stored in DB (e.g., simplistic filenames)
        return `http://localhost:8000/static/uploads/${url}`;
    };

    if (isLoading) return <div className="text-center py-10 flex items-center justify-center"><Loader2 className="animate-spin mr-2" /> Loading subscriptions...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Subscriptions</h1>
                    <p className="text-gray-500 mt-1">Manage your active subscriptions and payments.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/explore')}>
                    Explore Creators
                </Button>
            </div>

            {subscriptions.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                        <div className="p-4 rounded-full bg-gray-100">
                            <AlertCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">No subscriptions yet</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Support your favorite creators to unlock exclusive content and perks.
                            </p>
                        </div>
                        <Button onClick={() => navigate('/explore')}>
                            Find Creators
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renewal</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {subscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 relative">
                                                {sub.creator_avatar_url ? (
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover border"
                                                        src={getAvatarSrc(sub.creator_avatar_url)}
                                                        alt=""
                                                        onError={(e) => (e.target as HTMLImageElement).src = '/placeholder-avatar.png'}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                                                        <UserIcon className="h-5 w-5" />
                                                    </div>
                                                )}
                                                {sub.new_posts_count > 0 && (
                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                                        {sub.new_posts_count}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {sub.creator_name || 'Unknown Creator'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {sub.creator_email}
                                                </div>
                                                <div className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer mt-0.5" onClick={() => navigate(`/creator/${sub.creator_id}`)}>
                                                    View Profile
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {getStatusBadge(sub.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${(sub.monthly_price || 0).toFixed(2)} / mo
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(sub.current_period_end).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {sub.status === 'PENDING_PAYMENT' && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => handlePayClick(sub)}>
                                                    Pay
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-amber-600 hover:bg-amber-50"
                                                    onClick={() => handleSimulatePayment(sub)}
                                                    disabled={simulatingId === sub.id}
                                                >
                                                    {simulatingId === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
                                                    Simulate
                                                </Button>
                                            </>
                                        )}
                                        {sub.status === 'ACTIVE' && (
                                            <Button size="sm" variant="secondary" onClick={() => navigate(`/creator/${sub.creator_id}`)}>
                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                Go to Channel
                                            </Button>
                                        )}
                                        {sub.status === 'PENDING_REVIEW' && (
                                            <span className="text-gray-400 italic text-xs">Waiting for approval</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={!!selectedSub}
                onClose={() => setSelectedSub(null)}
                title="Complete Payment"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setSelectedSub(null)}>Cancel</Button>
                        <Button onClick={submitProof} disabled={!txHash || submitting}>
                            {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            Submit Proof
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 py-2">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-500">Amount</span>
                            <span className="font-bold">${(selectedSub?.monthly_price || 9.99).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-500">Beneficiary</span>
                            <span className="font-medium">{selectedSub?.creator_email}</span>
                        </div>

                        <div className="pt-2 border-t mt-2">
                            <p className="text-xs font-semibold text-indigo-600 mb-1">Payment Method</p>
                            <div className="bg-white p-2 rounded border text-xs">
                                {paymentMethod?.type} : <span className="font-mono">{paymentMethod?.details}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Transaction Hash (TXID)</label>
                        <Input
                            placeholder="0x..."
                            value={txHash}
                            onChange={(e) => setTxHash(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                            Confirm your payment on the blockchain and paste the transaction hash here.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}