import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Subscription {
    id: string;
    creator_id: string;
    consumer_id: string;
    creator_email?: string;
    status: 'pending_payment' | 'pending_review' | 'active' | 'rejected' | 'expired';
    proof_tx_hash?: string;
    current_period_end: string;
    created_at: string;
    monthly_price?: number;
}

export default function Payments() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
    const [txHash, setTxHash] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Payment Method (Mock)
    const [paymentMethod, setPaymentMethod] = useState<{ type: string, details: string } | null>(null);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const res = await api.get<Subscription[]>('/subscriptions/me');
            setSubscriptions(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handlePayClick = async (sub: Subscription) => {
        setSelectedSub(sub);
        setTxHash('');

        // Mock payment info
        setPaymentMethod({
            type: 'USDT (TRC20)',
            details: 'T9yD14Nj9... (Ask Creator)'
        });
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

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const pendingPayments = subscriptions.filter(s => s.status === 'pending_payment');
    const pendingReviews = subscriptions.filter(s => s.status === 'pending_review');
    const activeSubs = subscriptions.filter(s => s.status === 'active');
    const history = subscriptions.filter(s => ['rejected', 'expired'].includes(s.status));

    // Stats
    const totalActiveSpend = activeSubs.reduce((sum, sub) => sum + (sub.monthly_price || 0), 0);

    return (
        <div className="max-w-5xl mx-auto space-y-8 py-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
                    <p className="text-muted-foreground">Manage your subscriptions and billing.</p>
                </div>
                <Link to="/explore">
                    <Button variant="outline">Find New Creators</Button>
                </Link>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Monthly Spend</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalActiveSpend.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Estimated based on active plans</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSubs.length}</div>
                        <p className="text-xs text-muted-foreground">Creators you support</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingPayments.length}</div>
                        <p className="text-xs text-muted-foreground">Invoices due</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="active" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-gray-100 p-1">
                        <TabsTrigger value="active">Active ({activeSubs.length})</TabsTrigger>
                        <TabsTrigger value="pending">Pending ({pendingPayments.length + pendingReviews.length})</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                </div>

                {/* Active Tab */}
                <TabsContent value="active" className="space-y-4">
                    {activeSubs.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-gray-50 border-dashed">
                            <h3 className="text-lg font-medium text-gray-900">No active subscriptions</h3>
                            <p className="text-gray-500 mb-4">Start supporting creators to see your plans here.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {activeSubs.map(sub => (
                                <Card key={sub.id}>
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                        <div>
                                            <CardTitle className="text-base">{sub.creator_email}</CardTitle>
                                            <CardDescription>Simulated Plan</CardDescription>
                                        </div>
                                        <div className="font-bold">
                                            ${(sub.monthly_price || 0).toFixed(2)}/mo
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-green-600 mb-2">
                                            <CheckCircle className="w-4 h-4 mr-1" /> Active
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Renews on {new Date(sub.current_period_end).toLocaleDateString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Pending Tab */}
                <TabsContent value="pending" className="space-y-4">
                    {pendingPayments.map(sub => (
                        <Card key={sub.id} className="border-l-4 border-l-amber-400">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base font-medium">Invoice Due</CardTitle>
                                <Button size="sm" onClick={() => handlePayClick(sub)}>Pay Now</Button>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center text-sm">
                                    <span>To: <span className="font-medium">{sub.creator_email}</span></span>
                                    <span className="font-bold">${(sub.monthly_price || 0).toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Created {new Date(sub.created_at).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                    ))}

                    {pendingReviews.map(sub => (
                        <Card key={sub.id} className="border-l-4 border-l-blue-400">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium flex items-center">
                                    <Clock className="w-4 h-4 mr-2" /> Creating Payment Confirmation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">Paying {sub.creator_email}</p>
                                <p className="text-xs text-gray-400 mt-1 break-all">TX Hash: {sub.proof_tx_hash}</p>
                            </CardContent>
                        </Card>
                    ))}

                    {pendingPayments.length === 0 && pendingReviews.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No pending payments or reviews.
                        </div>
                    )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-4">
                    <div className="rounded-md border">
                        <div className="p-4 bg-gray-50 border-b font-medium text-sm flex justify-between">
                            <span>Subscription</span>
                            <span>Status</span>
                        </div>
                        {history.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">No history found.</div>
                        ) : (
                            history.map(sub => (
                                <div key={sub.id} className="p-4 border-b last:border-0 flex justify-between items-center text-sm">
                                    <div>
                                        <div className="font-medium">{sub.creator_email}</div>
                                        <div className="text-xs text-gray-500">Ended: {new Date(sub.current_period_end).toLocaleDateString()}</div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {sub.status.toUpperCase()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Note about future payments */}
            <div className="text-center text-xs text-gray-400 pt-8">
                <p>Supports Manual Crypto Payments. Stripe & Direct Integration coming soon.</p>
            </div>

            {/* Payment Modal */}
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
                            <span className="font-bold">${(selectedSub?.monthly_price || 0).toFixed(2)}</span>
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
