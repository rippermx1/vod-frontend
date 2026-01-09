import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { toast } from 'sonner';
import { Check, X, User, Loader2, ExternalLink } from 'lucide-react';

interface KYCSubmission {
    id: string;
    user_id: string;
    user_email: string;
    document_url: string;
    selfie_url: string;
    status: string;
    created_at: string;
}

export default function KYCReview() {
    const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/compliance/kyc/pending');
            setSubmissions(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load KYC submissions");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setProcessingId(id);
        try {
            await api.post(`/compliance/kyc/${id}/review`, {
                action: action,
                notes: action === 'reject' ? "Rejected by admin" : "Approved"
            });
            toast.success(`Submission ${action}d successfully`);
            // Refresh list
            setSubmissions(prev => prev.filter(sub => sub.id !== id));
        } catch (error) {
            console.error(error);
            toast.error(`Failed to ${action} submission`);
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-slate-600" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">KYC Review Queue</h1>
            {submissions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No pending submissions.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {submissions.map(sub => (
                        <Card key={sub.id}>
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* User Info */}
                                    <div className="lg:w-1/4 space-y-2">
                                        <div className="flex items-center space-x-2 text-slate-900 font-medium">
                                            <User className="h-4 w-4" />
                                            <span>User ID: <span className="font-mono text-xs text-gray-500">{sub.user_id.slice(0, 8)}...</span></span>
                                        </div>
                                        <div className="text-sm text-gray-500 break-all">{sub.user_email}</div>
                                        <div className="text-xs text-gray-400">Submitted: {new Date(sub.created_at).toLocaleDateString()}</div>
                                    </div>

                                    {/* Documents */}
                                    <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="text-sm font-medium text-gray-500">ID Document</span>
                                            <a
                                                href={`http://127.0.0.1:8000${sub.document_url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block relative aspect-video bg-gray-100 rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                                            >
                                                <img src={`http://127.0.0.1:8000${sub.document_url}`} alt="ID Doc" className="w-full h-full object-cover" />
                                                <ExternalLink className="absolute bottom-2 right-2 h-4 w-4 text-white bg-black/50 rounded p-0.5" />
                                            </a>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-sm font-medium text-gray-500">Selfie</span>
                                            <a
                                                href={`http://127.0.0.1:8000${sub.selfie_url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block relative aspect-video bg-gray-100 rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                                            >
                                                <img src={`http://127.0.0.1:8000${sub.selfie_url}`} alt="Selfie" className="w-full h-full object-cover" />
                                                <ExternalLink className="absolute bottom-2 right-2 h-4 w-4 text-white bg-black/50 rounded p-0.5" />
                                            </a>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="lg:w-1/4 flex flex-col justify-center space-y-3">
                                        <Button
                                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => handleAction(sub.id, 'approve')}
                                            disabled={!!processingId}
                                        >
                                            {processingId === sub.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                            onClick={() => handleAction(sub.id, 'reject')}
                                            disabled={!!processingId}
                                        >
                                            {processingId === sub.id ? <Loader2 className="animate-spin h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}