import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

// Types
interface PlanFeature {
    feature_key: string;
    is_enabled: boolean;
}
interface PlanLimit {
    limit_key: string;
    limit_value: number;
}
interface Plan {
    id: string;
    code: string;
    name: string;
    price_usdt: number;
    period_days: number;
    is_active: boolean;
    features: PlanFeature[];
    limits: PlanLimit[];
}

export default function AdminPlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    // Form Stats
    const [formData, setFormData] = useState<Partial<Plan>>({
        code: '',
        name: '',
        price_usdt: 0,
        period_days: 30,
        is_active: true,
        features: [],
        limits: []
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/admin/plans');
            setPlans(res.data);
        } catch (error) {
            toast.error("Failed to fetch plans");
        }
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            ...plan,
            features: plan.features || [],
            limits: plan.limits || []
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingPlan(null);
        setFormData({
            code: '',
            name: '',
            price_usdt: 0,
            period_days: 30,
            is_active: true,
            features: [
                { feature_key: 'custom_domain', is_enabled: false },
                { feature_key: 'remove_branding', is_enabled: false }
            ],
            limits: [
                { limit_key: 'max_storage_gb', limit_value: 5 },
                { limit_key: 'max_videos', limit_value: -1 }
            ]
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            // Validate
            if (!formData.code || !formData.name) {
                toast.error("Code and Name are required");
                return;
            }

            if (editingPlan) {
                await api.put(`/admin/plans/${editingPlan.id}`, formData);
                toast.success("Plan updated");
            } else {
                await api.post('/admin/plans', formData);
                toast.success("Plan created");
            }
            setIsModalOpen(false);
            fetchPlans();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save plan");
        }
    };

    const handleLimitChange = (index: number, val: string) => {
        const newLimits = [...(formData.limits || [])];
        newLimits[index].limit_value = parseInt(val) || 0;
        setFormData({ ...formData, limits: newLimits });
    };

    const handleFeatureToggle = (index: number) => {
        const newFeats = [...(formData.features || [])];
        newFeats[index].is_enabled = !newFeats[index].is_enabled;
        setFormData({ ...formData, features: newFeats });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">SaaS Plans</h1>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Create Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                            <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                {plan.is_active ? 'Active' : 'Archived'}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary mb-4">
                                ${plan.price_usdt.toFixed(2)}
                                <span className="text-sm text-muted-foreground font-normal"> / {plan.period_days} days</span>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="text-sm font-semibold text-foreground">Limits:</div>
                                {plan.limits.map(l => (
                                    <div key={l.limit_key} className="flex justify-between text-sm text-muted-foreground">
                                        <span>{l.limit_key}</span>
                                        <span>{l.limit_value === -1 ? 'Unlimited' : l.limit_value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="text-sm font-semibold text-foreground">Features:</div>
                                {plan.features.map(f => (
                                    <div key={f.feature_key} className="flex items-center text-sm">
                                        {f.is_enabled ? <Check className="h-4 w-4 text-green-500 mr-2" /> : <X className="h-4 w-4 text-red-400 mr-2" />}
                                        <span className={f.is_enabled ? "text-foreground" : "text-muted-foreground"}>{f.feature_key}</span>
                                    </div>
                                ))}
                            </div>

                            <Button variant="outline" className="w-full" onClick={() => handleEdit(plan)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Plan
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPlan ? 'Edit Plan' : 'Create New Plan'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Plan</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Plan Name</label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Code (Unique)</label>
                            <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} disabled={!!editingPlan} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Price (USDT)</label>
                            <Input type="number" value={formData.price_usdt} onChange={e => setFormData({ ...formData, price_usdt: parseFloat(e.target.value) })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Period (Days)</label>
                            <Input type="number" value={formData.period_days} onChange={e => setFormData({ ...formData, period_days: parseInt(e.target.value) })} />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="rounded border-gray-300 text-primary focus:ring-primary" />
                            <span className="text-sm">Is Active</span>
                        </label>
                    </div>

                    <div className="border-t border-border pt-4">
                        <h3 className="font-semibold mb-2">Limits</h3>
                        {formData.limits?.map((lim, idx) => (
                            <div key={idx} className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">{lim.limit_key}</span>
                                <Input
                                    type="number"
                                    className="w-24 h-8"
                                    value={lim.limit_value}
                                    onChange={(e) => handleLimitChange(idx, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-border pt-4">
                        <h3 className="font-semibold mb-2">Features</h3>
                        {formData.features?.map((feat, idx) => (
                            <label key={idx} className="flex items-center justify-between mb-2 cursor-pointer">
                                <span className="text-sm text-foreground">{feat.feature_key}</span>
                                <input type="checkbox" checked={feat.is_enabled} onChange={() => handleFeatureToggle(idx)} />
                            </label>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
