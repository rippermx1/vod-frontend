
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Loader2, Upload, User as UserIcon, Save, Image as ImageIcon } from 'lucide-react';

export default function ProfileCMS() {
    const { user, refreshUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Form for textual data
    const { register, handleSubmit, setValue } = useForm({
        defaultValues: {
            full_name: '',
            bio: '',
        }
    });

    useEffect(() => {
        if (user) {
            setValue('full_name', user.full_name || '');
            setValue('bio', user.bio || '');
        }
    }, [user, setValue]);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            await api.put('/auth/me', {
                full_name: data.full_name,
                bio: data.bio
            });
            await refreshUser();
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Verify WebP if strictly requested, but generally accept images
        // User asked for "animated webp" or "small video", so we must allow video/image.
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            toast.error("Please upload an image or video file");
            return;
        }

        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
            formData.append('media_type', mediaType);

            // We use the simple upload endpoint for now via cms
            const res = await api.post('/cms/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update user avatar_url
            // Assuming res.data is MediaRead with public_url or similar
            // If using LocalStorage (default in CMS upload currently), it returns media object.
            // Check Schema: MediaRead has public_url. 
            // In LocalStorage it's /static/uploads/...
            // In B2 it might be the key.

            // For MVP, we'll try to use the returned path. 
            // If it's a key, we might need a presigned url.
            // Let's assume the CMS upload returns a usable relative or absolute URL in 'file_path' or 'public_url'
            const media = res.data;
            let avatarUrl = media.public_url || media.file_path;

            // If it's a B2 key (doesn't start with http or /), we might have issues displaying it directly 
            // without a proxy. 
            // However, current standard /cms/upload uses LocalStorage by default (verified in service.py unless patched).
            // Wait, I saw cms/service.py using 'app.core.storage' which is LocalStorage. 
            // So it returns '/static/uploads/...' which is fine.

            await api.put('/auth/me', { avatar_url: avatarUrl });
            await refreshUser();
            toast.success("Avatar updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload avatar");
        } finally {
            setUploadingAvatar(false);
        }
    };

    if (!user) return <Loader2 className="animate-spin" />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Creator Profile</h1>
                    <p className="text-gray-500">Manage your public appearance and bio.</p>
                </div>
                <Button onClick={() => window.open(`/creator/${user.id}`, '_blank')} variant="outline">
                    View Public Page
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Avatar */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Avatar</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-6">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url.startsWith('http') || user.avatar_url.startsWith('/') ? user.avatar_url : `http://localhost:8000/static/uploads/${user.avatar_url}`}
                                        alt={user.full_name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback if broken
                                            (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <UserIcon className="w-16 h-16" />
                                    </div>
                                )}

                                {uploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition-colors"
                                title="Upload Avatar"
                            >
                                <Upload className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="text-center space-y-1">
                            <p className="text-xs text-gray-500">
                                Supports JPG, PNG, Animated WebP
                            </p>
                            <p className="text-xs text-gray-400">
                                Recommended 400x400px
                            </p>
                        </div>

                        <input
                            type="file"
                            ref={avatarInputRef}
                            className="hidden"
                            accept="image/*,.webp"
                            onChange={handleAvatarUpload}
                        />
                    </CardContent>
                </Card>

                {/* Right Column: Details */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Display Name</label>
                                <Input
                                    {...register('full_name')}
                                    placeholder="Your Public Name"
                                />
                                <p className="text-xs text-gray-500">
                                    This is the name that will be displayed on your channel and content.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Bio</label>
                                <textarea
                                    {...register('bio')}
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Tell your subscribers about yourself..."
                                />
                                <p className="text-xs text-gray-500">
                                    A brief description of who you are and what you create.
                                </p>
                            </div>

                            <div className="pt-4 border-t flex justify-end">
                                <Button type="submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Banner Placeholder (Future) */}
            <Card className="opacity-50 border-dashed">
                <CardHeader>
                    <CardTitle className="text-sm text-gray-500">Channel Banner (Coming Soon)</CardTitle>
                </CardHeader>
                <CardContent className="h-32 flex items-center justify-center text-gray-400">
                    <div className="flex flex-col items-center">
                        <ImageIcon className="h-8 w-8 mb-2" />
                        <span>Banner customization will be available in the next update.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
