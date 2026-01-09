import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';
import { toast } from 'sonner';
import { Check, Loader2, X, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SaasPlanLimit {
    limit_key: string;
    limit_value: number;
}

interface SaasPlanFeature {
    feature_key: string;
    is_enabled: boolean;
}

interface SaasPlan {
    id: string;
    code: string;
    name: string;
    price_usdt: number;
    period_days: number;
    features: SaasPlanFeature[];
    limits: SaasPlanLimit[];
}

const PLATFORM_WALLET = "TVjsy5X9r7GW8...MOCK...PLATFORM...WALLET";

export default function PricingPage() {
    const [plans, setPlans] = useState<SaasPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<SaasPlan | null>(null);
    const [txHash, setTxHash] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // New State
    const [subscription, setSubscription] = useState<any>(null);
    const [storageUsage, setStorageUsage] = useState<any>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, subRes, usageRes] = await Promise.all([
                    api.get('/plans/'),
                    api.get('/plans/me/subscription'),
                    api.get('/cms/storage-usage')
                ]);
                setPlans(plansRes.data);
                setSubscription(subRes.data);
                setStorageUsage(usageRes.data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load plan details");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSelectPlan = (plan: SaasPlan) => {
        if (plan.price_usdt === 0) {
            toast.info("This is a free plan/trial.");
            return;
        }
        setSelectedPlan(plan);
        setTxHash("");
    };

    const handleSubmitPayment = async () => {
        if (!selectedPlan || !txHash) {
            toast.error("Please enter the transaction hash");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/plans/pay', {
                plan_id: selectedPlan.id,
                amount_usdt: selectedPlan.price_usdt,
                tx_hash: txHash
            });
            toast.success("Payment submitted for review!");
            setSelectedPlan(null);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit payment");
        } finally {
            setSubmitting(false);
        }
    };

    const copyWallet = () => {
        navigator.clipboard.writeText(PLATFORM_WALLET);
        toast.success("Wallet address copied");
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-emerald-500" /></div>;
    }

    return (
        <div className="space-y-8 relative">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manage Your Plan</h1>
                <p className="text-gray-500">View your current status and storage usage.</p>
            </div>

            {/* Current Plan & Usage Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-emerald-500/20 bg-emerald-50/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Current Subscription</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Plan</p>
                            <p className="text-2xl font-bold text-emerald-700">{subscription?.plan?.name || "Free Trial"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {subscription?.status?.toUpperCase() || "ACTIVE"}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Renews / Expires</p>
                                <p className="font-medium">
                                    {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : "Never"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Storage Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {storageUsage && (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span>{storageUsage.used_gb} GB Used</span>
                                    <span>{storageUsage.limit_gb === -1 ? "Unlimited" : `${storageUsage.limit_gb} GB Total`}</span>
                                </div>
                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${storageUsage.percent_used > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(storageUsage.percent_used, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 text-right">
                                    {storageUsage.percent_used}% of your quota
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-sm text-gray-500">Available Plans</span>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.id} className={`flex flex-col relative overflow-hidden transition-all hover:shadow-lg ${subscription?.plan_id === plan.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200'}`}>
                        {plan.code === 'PRO' && (
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                                POPULAR
                            </div>
                        )}
                        {subscription?.plan_id === plan.id && (
                            <div className="absolute top-0 left-0 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-br-lg font-medium">
                                CURRENT PLAN
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                            <CardDescription>
                                <span className="text-3xl font-bold text-gray-900">${plan.price_usdt}</span>
                                <span className="text-gray-500"> / {plan.period_days} days</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <ul className="space-y-2 text-sm text-gray-600">
                                {plan.limits.map(l => (
                                    <li key={l.limit_key} className="flex items-center">
                                        <Check className="h-4 w-4 text-emerald-500 mr-2" />
                                        {l.limit_value === -1 ? "Unlimited" : l.limit_value} {l.limit_key.replace('_', ' ')}
                                    </li>
                                ))}
                                {plan.features.filter(f => f.is_enabled).map(f => (
                                    <li key={f.feature_key} className="flex items-center">
                                        <Check className="h-4 w-4 text-emerald-500 mr-2" />
                                        {f.feature_key.replace('_', ' ')}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className={`w-full ${subscription?.plan_id === plan.id ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                onClick={() => handleSelectPlan(plan)}
                                disabled={subscription?.plan_id === plan.id}
                            >
                                {subscription?.plan_id === plan.id ? "Current Plan" : `Choose ${plan.name}`}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Payment Modal Overlay */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md bg-white shadow-xl border-emerald-500/20">
                        <CardHeader className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-4 top-4 h-8 w-8 p-0"
                                onClick={() => setSelectedPlan(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <CardTitle>Subscribe to {selectedPlan.name}</CardTitle>
                            <CardDescription>
                                Total: <span className="font-bold text-emerald-600">${selectedPlan.price_usdt} USDT</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">1. Send Payment (USDT TRC20)</label>
                                <div className="flex items-center space-x-2">
                                    <code className="flex-1 rounded bg-gray-100 p-2 text-xs break-all border border-gray-200">
                                        {PLATFORM_WALLET}
                                    </code>
                                    <Button size="sm" variant="outline" onClick={copyWallet}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">2. Enter Transaction Hash</label>
                                <Input placeholder="0x..." value={txHash} onChange={(e) => setTxHash(e.target.value)} />
                                <p className="text-xs text-gray-500">
                                    We will verify the transaction on the blockchain.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setSelectedPlan(null)}>Cancel</Button>
                            <Button
                                onClick={handleSubmitPayment}
                                disabled={submitting || !txHash}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Payment
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}