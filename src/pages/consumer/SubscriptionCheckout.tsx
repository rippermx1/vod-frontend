import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';
import { Copy, CheckCircle, Loader2, Zap } from 'lucide-react';

interface PaymentMethod {
    id: string;
    payment_type: string;
    details: {
        address: string;
        network: string;
    };
    is_active: boolean;
}

interface Subscription {
    id: string;
    consumer_id: string;
    creator_id: string;
    status: string;
    proof_tx_hash?: string;
}

interface ProofForm {
    tx_hash: string;
}

export default function SubscriptionCheckout() {
    const { subId } = useParams<{ subId: string }>();
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProofForm>();

    useEffect(() => {
        if (subId) {
            fetchData();
        }
    }, [subId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Get Subscription to know Creator
            const subRes = await api.get(`/subscriptions/${subId}`);
            setSubscription(subRes.data);

            // 2. Get Creator Payment Methods
            const methodsRes = await api.get(`/plans/payment-methods/${subRes.data.creator_id}`);
            setPaymentMethods(methodsRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load checkout details');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: ProofForm) => {
        if (!subId) return;
        try {
            await api.post(`/subscriptions/${subId}/proof`, { tx_hash: data.tx_hash });
            toast.success('Proof submitted successfully!');
            // Reload to show status
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit proof');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Address copied');
    };

    const handleSimulatePayment = async () => {
        if (!subId) return;
        if (!confirm("Simulate successful payment for local testing?")) return;
        try {
            await api.post(`/subscriptions/${subId}/simulate-payment`);
            toast.success("Payment simulated! Subscription active.");
            navigate('/subscriptions');
        } catch (error) {
            console.error(error);
            toast.error("Failed to simulate payment");
        }
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;

    if (!subscription) return <div className="text-center py-10">Subscription not found</div>;

    // Status: Active
    if (subscription.status === 'active') {
        return (
            <div className="max-w-md mx-auto py-12 text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h1 className="text-2xl font-bold">Subscription Active!</h1>
                <p className="text-gray-500">You have access to this creator's content.</p>
                <Button onClick={() => navigate(`/creator/${subscription.creator_id}`)}>
                    Go to Creator Profile
                </Button>
            </div>
        );
    }

    // Status: Pending Review
    if (subscription.status === 'pending_review') {
        return (
            <div className="max-w-md mx-auto py-12 text-center space-y-4">
                <div className="bg-yellow-100 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold">Payment Under Review</h1>
                <p className="text-gray-500">
                    Your proof has been submitted. The creator will review and approve it shortly.
                </p>
                <Button variant="outline" onClick={() => navigate(`/creator/${subscription.creator_id}`)}>
                    Back to Profile
                </Button>
            </div>
        );
    }

    // Status: Pending Payment (Default)
    return (
        <div className="max-w-xl mx-auto space-y-8 py-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Complete Subscription</h1>
                <p className="text-gray-500">Send payment to activate access.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>1. Send Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md border text-center">
                        <span className="text-sm text-gray-500 uppercase tracking-wide">Amount Due</span>
                        <div className="text-3xl font-bold text-emerald-600">$10.00 USD</div>
                        <div className="text-xs text-gray-400 mt-1">Roughly 10 USDT</div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Send USDT (TRC20) to:</label>
                        {paymentMethods.length > 0 ? (
                            paymentMethods.map(method => (
                                <div key={method.id} className="p-3 bg-gray-100 rounded-md border flex items-center justify-between break-all">
                                    <code className="text-sm font-mono">{method.details.address}</code>
                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(method.details.address)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md">
                                Creator has not set up a payment method. Please contact them.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>2. Submit Proof</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Transaction Hash (TXID)
                            </label>
                            <Input
                                className="mt-2"
                                placeholder="Paste the transaction hash here..."
                                {...register('tx_hash', { required: true })}
                            />
                        </div>
                        <p className="text-xs text-gray-400">
                            We will use this to verify the payment on the blockchain.
                        </p>
                        <Button type="submit" className="w-full" disabled={isSubmitting || paymentMethods.length === 0}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Payment Proof
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Dev Only: Simulation */}
            <div className="text-center pt-4 border-t">
                <Button variant="ghost" className="text-amber-600 hover:bg-amber-50" onClick={handleSimulatePayment}>
                    <Zap className="mr-2 h-4 w-4" />
                    Simulate Payment (Dev Only)
                </Button>
            </div>
        </div>
    );
}