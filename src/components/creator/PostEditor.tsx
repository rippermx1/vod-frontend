
import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { MarkdownEditor } from '../../components/ui/MarkdownEditor';
import { toast } from 'sonner';
import { Loader2, FileVideo, FileImage, Trash, Plus, Calendar, Save, Send } from 'lucide-react';
import MediaSelector from '../../pages/creator/MediaSelector';

interface Post {
    id: string;
    title: string;
    description: string;
    is_free: boolean;
    price?: number;
    status: string;
    category?: string;
    tags?: string[];
    cover_image_url?: string;
    published_at?: string;
    media_items?: any[];
}

interface PostEditorProps {
    postId?: string | null;
    initialData?: Partial<Post>;
    onSaveSuccess?: (post: Post) => void;
    onPublishSuccess?: (post: Post) => void;
    className?: string;
}

export default function PostEditor({ postId: initialPostId, initialData, onSaveSuccess, onPublishSuccess, className }: PostEditorProps) {
    const [postId, setPostId] = useState<string | null>(initialPostId || null);
    const [post, setPost] = useState<Partial<Post>>(initialData || {});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'media'>('details');

    // UI States
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [selectingCover, setSelectingCover] = useState(false);
    const [mediaToAttach, setMediaToAttach] = useState<any[]>([]);
    const [publishImmediately, setPublishImmediately] = useState(false);

    const handleAttachSelected = async () => {
        if (!postId || mediaToAttach.length === 0) return;
        setSaving(true);
        try {
            await Promise.all(mediaToAttach.map(m => api.post(`/cms/posts/${postId}/attach/${m.id}`)));
            toast.success(`${mediaToAttach.length} items attached`);
            setMediaToAttach([]);
            setShowMediaSelector(false);
            fetchPost(postId);
        } catch (error) {
            console.error(error);
            toast.error("Failed to attach some items");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (initialPostId) {
            setPostId(initialPostId);
            fetchPost(initialPostId);
        }
    }, [initialPostId]);

    const fetchPost = async (id: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/cms/posts/${id}`);
            setPost({
                ...res.data,
                published_at: res.data.published_at ? formatToLocalIso(res.data.published_at) : ''
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to load post data");
        } finally {
            setLoading(false);
        }
    };

    const formatToLocalIso = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: any = {
                title: post.title,
                description: post.description,
                is_free: post.is_free,
                price: post.price,
                category: post.category,
                tags: Array.isArray(post.tags) ? post.tags : (post.tags as unknown as string)?.split(',').map(t => t.trim()).filter(Boolean),
                cover_image_url: post.cover_image_url,
                published_at: post.published_at ? new Date(post.published_at).toISOString() : null
            };

            let savedPost;
            if (postId) {
                const res = await api.put(`/cms/posts/${postId}`, payload);
                savedPost = res.data;
                toast.success("Saved changes");
            } else {
                const res = await api.post('/cms/posts', payload);
                savedPost = res.data;
                setPostId(savedPost.id);
                toast.success("Draft created");
            }

            setPost(prev => ({ ...prev, ...savedPost, published_at: payload.published_at ? formatToLocalIso(payload.published_at) : '' }));
            if (onSaveSuccess) onSaveSuccess(savedPost);

        } catch (error) {
            console.error(error);
            toast.error("Failed to save post");
        } finally {
            setSaving(false);
        }
    };

    const handleFinish = async () => {
        if (!postId) return;

        const isScheduling = !publishImmediately && !!post.published_at;
        const actionLabel = isScheduling ? "Schedule" : "Publish Immediately";

        if (!window.confirm(`Are you sure you want to ${actionLabel.toLowerCase()} this post?`)) return;

        setSaving(true);
        try {
            const payload = {
                status: 'published',
                published_at: isScheduling && post.published_at ? new Date(post.published_at).toISOString() : new Date().toISOString()
            };

            await api.put(`/cms/posts/${postId}`, payload);
            toast.success(isScheduling ? "Post scheduled!" : "Post published is live!");

            setPost(prev => ({
                ...prev,
                status: 'published',
                published_at: payload.published_at
            }));

            if (onPublishSuccess && postId) {
                onPublishSuccess({
                    ...post,
                    id: postId,
                    status: 'published',
                    published_at: payload.published_at
                } as Post);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update post status");
        } finally {
            setSaving(false);
        }
    };

    const handleAttachMedia = async (mediaId: string) => {
        if (!postId) return;
        try {
            await api.post(`/cms/posts/${postId}/attach/${mediaId}`);
            toast.success("Media attached");
            setShowMediaSelector(false);
            fetchPost(postId);
        } catch (error) {
            console.error(error);
            toast.error("Failed to attach media");
        }
    };

    const handleDetachMedia = async (mediaId: string) => {
        if (!postId || !window.confirm("Remove this media?")) return;
        try {
            await api.delete(`/cms/posts/${postId}/media/${mediaId}`);
            toast.success("Media removed");
            fetchPost(postId);
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove media");
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-500" /></div>;

    const isScheduling = !publishImmediately && !!post.published_at;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Navigation Tabs (Only if saved) */}
            {postId && (
                <div className="flex border-b mb-4 overflow-x-auto no-scrollbar">
                    <button
                        className={`px-4 md:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'details' ? 'border-emerald-500 text-emerald-500' : 'border-transparent hover:text-gray-700'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                    <button
                        className={`px-4 md:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'media' ? 'border-emerald-500 text-emerald-500' : 'border-transparent hover:text-gray-700'}`}
                        onClick={() => setActiveTab('media')}
                    >
                        Media ({post.media_items?.length || 0})
                    </button>
                </div>
            )}

            <div className={activeTab === 'details' ? 'block' : 'hidden'}>
                <div className="grid gap-6">
                    {/* Cover Image */}
                    <Card>
                        <CardContent className="p-4">
                            <label className="block text-sm font-medium mb-2">Cover Image</label>
                            {selectingCover ? (
                                <div className="space-y-4">
                                    <MediaTypeSelector
                                        type="image"
                                        onSelect={(media: any) => {
                                            setPost(prev => ({ ...prev, cover_image_url: media.filename }));
                                            setSelectingCover(false);
                                        }}
                                        onCancel={() => setSelectingCover(false)}
                                    />
                                </div>
                            ) : post.cover_image_url ? (
                                <div className="relative aspect-video w-full rounded-md overflow-hidden border group">
                                    <img src={post.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Button variant="destructive" size="sm" onClick={() => setPost(prev => ({ ...prev, cover_image_url: '' }))}>
                                            Remove Cover
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setSelectingCover(true)}
                                    className="aspect-video w-full rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <FileImage className="h-8 w-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">Click to set cover image</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <Input
                                value={post.title || ''}
                                onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Post Title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <MarkdownEditor
                                value={post.description || ''}
                                onChange={(val) => setPost(prev => ({ ...prev, description: val }))}
                                rows={8}
                                placeholder="Describe your post..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <Input
                                    value={post.category || ''}
                                    onChange={(e) => setPost(prev => ({ ...prev, category: e.target.value }))}
                                    placeholder="e.g. Tutorials"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tags (Comma Separated)</label>
                                <Input
                                    value={Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || ''}
                                    onChange={(e) => setPost(prev => ({ ...prev, tags: e.target.value.split(',') }))}
                                    placeholder="react, coding, vlogs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Access</label>
                                <select
                                    value={post.is_free ? 'true' : 'false'}
                                    onChange={(e) => {
                                        const isFree = e.target.value === 'true';
                                        setPost(prev => ({
                                            ...prev,
                                            is_free: isFree,
                                            price: isFree ? 0 : prev.price
                                        }));
                                    }}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="true">Free (Public)</option>
                                    <option value="false">Premium / Paid</option>
                                </select>
                            </div>

                            {!post.is_free && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (USD)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={post.price || ''}
                                            onChange={(e) => setPost(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                            placeholder="0.00 (Leave empty for Subscribers Only)"
                                            className="pl-7"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Set a price for Pay-Per-View, or leave as 0 for Subscription Access only.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Schedule</label>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="publishNow"
                                        checked={publishImmediately}
                                        onChange={(e) => setPublishImmediately(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                    />
                                    <label htmlFor="publishNow" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Publish Immediately
                                    </label>
                                </div>

                                {!publishImmediately && (
                                    <div>
                                        <Input
                                            type="datetime-local"
                                            value={post.published_at || ''}
                                            onChange={(e) => setPost(prev => ({ ...prev, published_at: e.target.value }))}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Select a future date to schedule.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Tab */}
            {postId && (
                <div className={activeTab === 'media' ? 'block' : 'hidden'}>
                    {showMediaSelector ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Select Media</h3>
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => {
                                        setShowMediaSelector(false);
                                        setMediaToAttach([]);
                                    }}>Cancel</Button>
                                    {mediaToAttach.length > 0 && (
                                        <Button onClick={handleAttachSelected}>
                                            Attach {mediaToAttach.length} Items
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <MediaTypeSelector
                                multiple={true}
                                selectedIds={mediaToAttach.map(m => m.id)}
                                onSelect={(media: any) => {
                                    const items = Array.isArray(media) ? media : [media];
                                    setMediaToAttach(items);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Attached Items</h3>
                                <Button onClick={() => setShowMediaSelector(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Media
                                </Button>
                            </div>

                            {(!post.media_items || post.media_items.length === 0) ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg text-gray-500">
                                    No media attached. Click "Add Media" to select files.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {post.media_items.map((media: any) => (
                                        <div key={media.id} className="group relative border rounded-md p-2">
                                            {media.is_public_preview && (
                                                <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm">
                                                    Trailer
                                                </div>
                                            )}
                                            <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center relative">
                                                {media.media_type === 'video' ? <FileVideo className="h-8 w-8 text-gray-400" /> : <FileImage className="h-8 w-8 text-gray-400" />}
                                            </div>
                                            <p className="text-xs truncate font-medium mb-2">{media.filename}</p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className={`flex-1 h-7 text-xs ${media.is_public_preview ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : ''}`}
                                                    onClick={async () => {
                                                        try {
                                                            const newState = !media.is_public_preview;
                                                            const res = await api.put(`/cms/media/${media.id}/preview`, { is_public_preview: newState });
                                                            // Update local state
                                                            const updated = res.data;
                                                            setPost(prev => ({
                                                                ...prev,
                                                                media_items: prev.media_items?.map(m => m.id === updated.id ? updated : m)
                                                            }));
                                                            toast.success(newState ? "Set as Trailer" : "Removed as Trailer");
                                                        } catch (e) {
                                                            toast.error("Failed to update");
                                                        }
                                                    }}
                                                >
                                                    {media.is_public_preview ? "Trailer" : "Make Trailer"}
                                                </Button>
                                                <Button variant="destructive" size="sm" className="h-7 px-2" onClick={() => handleDetachMedia(media.id)}>
                                                    <Trash className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6 sticky bottom-0 bg-white/95 p-4 backdrop-blur-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none md:p-0 md:bg-transparent md:static z-10 transition-all duration-200">
                <Button variant="outline" onClick={() => handleSave()} disabled={saving} className="flex-1 md:flex-none">
                    <Save className="mr-2 h-4 w-4" />
                    {postId ? "Save" : "Draft"}
                </Button>

                {postId && (
                    <Button onClick={handleFinish} disabled={saving} className={`flex-1 md:flex-none text-white ${isScheduling ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                        {isScheduling ? <Calendar className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                        {isScheduling ? "Schedule" : "Publish"}
                    </Button>
                )}
            </div>
        </div>
    );
}

// Wrapper to simplify MediaSelector usage
function MediaTypeSelector(props: any) {
    return (
        <MediaSelector
            filterType={props.type}
            multiple={props.multiple}
            selectedIds={props.selectedIds}
            onSelect={props.onSelect}
        />
    )
}
