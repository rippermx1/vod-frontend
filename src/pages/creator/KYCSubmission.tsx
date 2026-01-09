import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, Upload, FileImage, ShieldCheck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function KYCSubmission() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const { handleSubmit } = useForm();

    // File states
    const [docFile, setDocFile] = useState<File | null>(null);
    const [docPreview, setDocPreview] = useState<string | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

    const docRef = useRef<HTMLInputElement>(null);
    const selfieRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'doc' | 'selfie') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be under 5MB");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        if (type === 'doc') {
            setDocFile(file);
            setDocPreview(previewUrl);
        } else {
            setSelfieFile(file);
            setSelfiePreview(previewUrl);
        }
    };

    const onSubmit = async () => {
        if (!docFile || !selfieFile) {
            toast.error("Please upload both documents");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('document', docFile);
            formData.append('selfie', selfieFile);

            await api.post('/compliance/kyc', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success("KYC Submitted Successfully");
            window.location.reload(); // Refresh to update status
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit KYC");
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return <Loader2 className="animate-spin" />;

    if (user.kyc_status === 'verified') {
        return (
            <div className="max-w-3xl mx-auto py-12 text-center space-y-6">
                <div className="bg-green-100 text-green-600 p-6 rounded-full inline-flex">
                    <CheckCircle className="h-16 w-16" />
                </div>
                <h1 className="text-3xl font-bold">You are Verified!</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    Your identity has been verified. You now have full access to monetization, withdrawals, and higher limits.
                </p>
                <div className="pt-4">
                    <Button variant="outline" onClick={() => navigate('/creator/settings')}>
                        View Account Settings
                    </Button>
                </div>
            </div>
        );
    }

    if (user.kyc_status === 'pending') {
        return (
            <div className="max-w-3xl mx-auto py-12 text-center space-y-6">
                <div className="bg-yellow-100 text-yellow-600 p-6 rounded-full inline-flex">
                    <Clock className="h-16 w-16" />
                </div>
                <h1 className="text-3xl font-bold">Verification in Progress</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    We have received your documents and they are currently under review. This usually takes 24-48 hours. You will be notified once the process is complete.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 py-6">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Identity Verification</h1>
                <p className="text-lg text-gray-600 max-w-xl">
                    Unlock all creator features by verifying your identity. Your data is encrypted and securely stored.
                </p>
            </div>

            {user.kyc_status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start space-x-3 text-red-800">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold">Verification Rejected</h4>
                        <p className="text-sm mt-1 opacity-90">
                            Your previous submission was rejected. Please ensure your documents are clear and match your profile information before trying again.
                        </p>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Upload Documents</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* ID Document Section */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                1. Government ID (Passport, Driver's License)
                            </label>
                            <div
                                className="group relative border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-50/50 transition-all duration-200 ease-in-out"
                                onClick={() => docRef.current?.click()}
                            >
                                {docPreview ? (
                                    <div className="relative w-full aspect-video max-w-md rounded-lg overflow-hidden shadow-sm ring-1 ring-black/10">
                                        <img src={docPreview} alt="ID Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Upload className="h-8 w-8 text-white mb-2" />
                                            <span className="text-white font-medium text-sm">Change Document</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="bg-indigo-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
                                            <Upload className="h-6 w-6 text-indigo-500" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            Upload your ID
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                                            Drag & drop or click to upload. Supports JPEG, PNG up to 5MB.
                                        </p>
                                    </div>
                                )}
                                <input type="file" ref={docRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'doc')} />
                            </div>
                        </div>

                        {/* Selfie Section */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                2. Selfie with ID
                            </label>
                            <div
                                className="group relative border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-50/50 transition-all duration-200 ease-in-out"
                                onClick={() => selfieRef.current?.click()}
                            >
                                {selfiePreview ? (
                                    <div className="relative w-full aspect-square max-w-[240px] rounded-lg overflow-hidden shadow-sm ring-1 ring-black/10">
                                        <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <FileImage className="h-8 w-8 text-white mb-2" />
                                            <span className="text-white font-medium text-sm">Change Selfie</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center">
                                        <div className="bg-indigo-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
                                            <FileImage className="h-6 w-6 text-indigo-500" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            Upload Selfie
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                                            Make sure your face and ID are clearly visible.
                                        </p>
                                    </div>
                                )}
                                <input type="file" ref={selfieRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'selfie')} />
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <Button type="submit" className="w-full" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                                    </>
                                ) : (
                                    'Submit for Review'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}