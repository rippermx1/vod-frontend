import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Loader2, ShieldCheck, Wallet, DollarSign } from 'lucide-react';

interface PaymentMethod {
    id: string;
    payment_type: string;
    details: {
        address: string;
        network: string;
    };
    is_active: boolean;
}

interface PaymentMethodForm {
    address: string;
}

export default function Settings() {
    const { user } = useAuth();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PaymentMethodForm>();

    useEffect(() => {
        if (user?.id) {
            fetchPaymentMethods();
        }
    }, [user?.id]);

    const fetchPaymentMethods = async () => {
        try {
            const res = await api.get(`/plans/payment-methods/${user?.id}`);
            setMethods(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load payment methods');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: PaymentMethodForm) => {
        try {
            await api.post('/plans/me/payment-methods', {
                payment_type: 'USDT_TRC20',
                details: {
                    address: data.address,
                    network: 'TRC20'
                }
            });
            toast.success('Payment method saved');
            reset();
            fetchPaymentMethods();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save payment method');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

            {/* Monetization Section */}
            <MonetizationSettings user={user} />

            {/* Profile Editor */}
            <ProfileEditor user={user} />

            {/* KYC Status Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Verification Status (KYC)</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Your current identity verification status.
                            </p>
                        </div>
                        <KYCBadge status={user?.kyc_status || 'not_verified'} />
                    </div>

                    {(user?.kyc_status === 'none' || user?.kyc_status === 'rejected') && (
                        <div className="mt-6 relative overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 p-6 sm:p-8">
                            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div className="space-y-2 max-w-xl">
                                    <h4 className="text-lg font-semibold text-indigo-950">
                                        {user?.kyc_status === 'rejected' ? 'Verification Action Required' : 'Unlock Potential'}
                                    </h4>
                                    <p className="text-sm text-indigo-900/70 leading-relaxed">
                                        {user?.kyc_status === 'rejected'
                                            ? "Your previous application was updated. Please check the feedback and resubmit to enable monetization."
                                            : "Verify your identity today to start earning from your content. Enabling monetization, withdrawals, and higher limits takes just 2 minutes."}
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <Link to="/creator/kyc">
                                        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 border-0">
                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                            {user?.kyc_status === 'rejected' ? 'Resolve Issue' : 'Verify Identity'}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl"></div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Methods Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Wallet className="h-5 w-5 text-green-500" />
                        <CardTitle>Payment Methods</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Add USDT (TRC20) Address</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Wallet Address
                                </label>
                                <Input
                                    className="mt-2"
                                    placeholder="T..."
                                    {...register('address', { required: true })}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Ensure this is a valid TRC20 address. Funds sent to wrong addresses cannot be recovered.
                                </p>
                            </div>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Address
                            </Button>
                        </form>
                    </div>

                    <div className="pt-6 border-t">
                        <h3 className="text-sm font-medium mb-4">Saved Methods</h3>
                        {isLoading ? (
                            <div className="text-sm text-gray-500">Loading...</div>
                        ) : methods.length === 0 ? (
                            <div className="text-sm text-gray-500">No payment methods saved.</div>
                        ) : (
                            <div className="space-y-2">
                                {methods.map((method) => (
                                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{method.payment_type.replace('_', ' ')}</span>
                                            <span className="text-xs text-gray-500 font-mono truncate max-w-[200px] sm:max-w-md">
                                                {method.details.address}
                                            </span>
                                        </div>
                                        <Badge variant={method.is_active ? 'success' : 'secondary'}>
                                            {method.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MonetizationSettings({ user }: { user: any }) {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm({
        defaultValues: {
            monthly_price: user?.monthly_price ?? 9.99,
            subscription_enabled: user?.subscription_enabled ?? true
        }
    });

    const onSubmit = async (data: any) => {
        try {
            await api.put('/auth/me', {
                monthly_price: parseFloat(data.monthly_price),
                subscription_enabled: String(data.subscription_enabled) === 'true'
            });
            toast.success('Monetization updated');
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update settings');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                    <CardTitle>Monetization</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Monthly Subscription Price (USDT)</label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('monthly_price', { required: true, min: 0 })}
                        />
                        <p className="text-xs text-gray-500">
                            Amount users pay per month to access your premium content.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Subscription Status</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...register('subscription_enabled')}
                        >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function KYCBadge({ status }: { status: string }) {
    switch (status) {
        case 'verified': return <Badge variant="success">Verified</Badge>;
        case 'pending': return <Badge variant="warning">Pending Review</Badge>;
        case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
        case 'none': return <Badge variant="secondary">Not Verified</Badge>;
        default: return <Badge variant="secondary">Not Verified</Badge>;
    }
}

function ProfileEditor({ user }: { user: any }) {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm({
        defaultValues: {
            full_name: user?.full_name || '',
            bio: user?.bio || '',
            avatar_url: user?.avatar_url || ''
        }
    });

    const onProfileSubmit = async (data: any) => {
        try {
            await api.put('/auth/me', data);
            toast.success('Profile updated');
            // Ideally refresh user context here, but reloading page works for MVP
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                    <CardTitle>Profile Details</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Display Name</label>
                        <Input className="mt-1" placeholder="Your Name" {...register('full_name')} />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Bio</label>
                        <Input className="mt-1" placeholder="Tell us about yourself" {...register('bio')} />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Avatar URL</label>
                        <Input className="mt-1" placeholder="https://..." {...register('avatar_url')} />
                        <p className="text-xs text-gray-500 mt-1">Link to your profile picture</p>
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Profile
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}