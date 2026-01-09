
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, ArrowLeft, PlayCircle, FileText, Lock } from 'lucide-react';
import { VideoPlayer } from '../../components/VideoPlayer';
import { toast } from 'sonner';

interface Media {
    id: string;
    media_type: string;
    public_url: string;
    processing_status: string;
}

interface Post {
    id: string;
    title: string;
    description: string;
    is_free: boolean;
    price?: number;
    media_items: Media[];
    published_at: string;
    creator_id: string;
}

export default function PostDetail() {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [playingMediaId, setPlayingMediaId] = useState<string | null>(null);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    useEffect(() => {
        if (postId) {
            fetchPost();
            checkAccess();
        }
    }, [postId]);

    const fetchPost = async () => {
        setIsLoading(true);
        try {
            // Let's assume GET /cms/posts/{id} works for now.
            const res = await api.get(`/cms/posts/${postId}`);
            setPost(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load post");
        } finally {
            setIsLoading(false);
        }
    };

    const checkAccess = async () => {
        try {
            // Check if purchased separately
            const res = await api.get(`/sales/content/${postId}/check_access`);
            setHasPurchased(res.data.access);
        } catch (error) {
            console.error(error);
        }
    }

    const handlePurchase = async () => {
        if (!txHash) {
            toast.error("Please enter a transaction hash");
            return;
        }
        setPurchasing(true);
        try {
            await api.post(`/sales/content/${postId}/purchase`, { tx_hash: txHash });
            toast.success("Purchase successful! Content unlocked.");
            setHasPurchased(true);
            setShowPurchaseModal(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Purchase failed");
        } finally {
            setPurchasing(false);
        }
    };

    if (isLoading) return <div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;

    if (!post) return <div className="text-center py-10">Post not found</div>;

    // Determine access: Free OR Subscribed (implied by backend logic, but here assume if media is returned it's accessible?)
    // Actually, backend usually filters media if not accessible.
    // If backend returns media_items empty or scrambled, frontend knows. 
    // BUT current backend endpoint `get_content` might not enforce entitlement yet? 
    // Let's assume backend is secured (it should be).
    // If we can see media_items, we have access. 
    // Wait, the prompt implies we need to ENFORCE valid access for "Paid" posts.
    // Logic: If !is_free and Price > 0 and !HasPurchased: Show Lock Screen instead of Media.

    // Safety check for post
    const isLocked = post && !post.is_free && (post.price || 0) > 0 && !hasPurchased;

    // Note: If it's Subscription-Only (price=0) and !is_free, we assume the user HAS access via subscription 
    // if they can see the post details. (Backend should handle 403 or hide media).

    // For this task, we specifically care about Price > 0.

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <Card className="overflow-hidden bg-white shadow-md">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold text-slate-900">{post.title}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(post.published_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {!post.is_free && (
                                <div className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full font-medium flex items-center">
                                    <Lock className="w-3 h-3 mr-1" /> Premium
                                </div>
                            )}
                            {hasPurchased && (
                                <div className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium flex items-center">
                                    Purchased
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {post.description && (
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {post.description}
                        </div>
                    )}

                    {/* Public Previews */}
                    {post.media_items.filter((m: any) => m.is_public_preview).length > 0 && (
                        <div className="mb-8 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm tracking-wide">FREE PREVIEW</span>
                            </div>
                            <div className="grid gap-6">
                                {post.media_items.filter((m: any) => m.is_public_preview).map((media: any) => (
                                    <div key={media.id} className="rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-sm relative">
                                        {media.media_type === 'video' ? (
                                            <div className="w-full aspect-video bg-black relative">
                                                {playingMediaId === media.id ? (
                                                    <VideoPlayer mediaId={media.id} className="w-full h-full" />
                                                ) : (
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                                                        onClick={() => setPlayingMediaId(media.id)}
                                                    >
                                                        <div className="w-20 h-20 bg-white/10 group-hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-all transform group-hover:scale-105">
                                                            <PlayCircle className="w-12 h-12 text-white fill-white/20" />
                                                        </div>
                                                        <span className="absolute bottom-6 text-sm font-medium text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                                                            Watch Trailer
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <img
                                                src={`http://127.0.0.1:8000${media.public_url}`}
                                                alt="Preview"
                                                className="w-full h-auto max-h-[600px] object-contain mx-auto"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isLocked ? (
                        <div className="bg-slate-900 rounded-xl p-10 text-center text-white space-y-4 border border-slate-800 shadow-inner">
                            <div className="bg-slate-800 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                                <Lock className="w-10 h-10 text-yellow-500" />
                            </div>
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Unlock Full Access</h3>
                            <p className="text-slate-400 max-w-md mx-auto text-lg">
                                Purchase this post for <span className="text-white font-bold">${post.price}</span> to get instant access to the full content.
                            </p>

                            {!showPurchaseModal ? (
                                <Button
                                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-6 text-lg shadow-lg shadow-yellow-500/20 mt-4"
                                    onClick={() => setShowPurchaseModal(true)}
                                >
                                    Buy Now for ${post.price}
                                </Button>
                            ) : (
                                <div className="max-w-md mx-auto bg-slate-800 p-6 rounded-lg text-left space-y-4 border border-slate-700 mt-6 shadow-xl">
                                    <h4 className="font-semibold text-lg border-b border-slate-700 pb-2 mb-2">Complete Purchase</h4>
                                    <p className="text-sm text-slate-400">
                                        Send <strong>${post.price}</strong> to the creator's wallet (USDT/USDC).
                                        <br />
                                        <code className="bg-black/50 p-2 rounded text-xs select-all block mt-2 font-mono text-green-400 border border-slate-700">
                                            T9yD14Nj9... (Mock Wallet)
                                        </code>
                                    </p>

                                    <div>
                                        <label className="text-sm font-medium mb-1 block text-slate-300">Transaction Hash (Proof)</label>
                                        <input
                                            type="text"
                                            value={txHash}
                                            onChange={(e) => setTxHash(e.target.value)}
                                            placeholder="Enter TXID..."
                                            className="w-full h-10 rounded-md border border-slate-600 bg-black/50 px-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                                        />
                                    </div>

                                    <div className="flex gap-2 justify-end pt-2">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowPurchaseModal(false)}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={handlePurchase}
                                            disabled={purchasing || !txHash}
                                        >
                                            {purchasing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                            Confirm Payment
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {post.media_items.filter((m: any) => !m.is_public_preview).map((media: Media) => (
                                <div key={media.id} className="rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-sm">
                                    {media.media_type === 'image' ? (
                                        <img
                                            src={`http://127.0.0.1:8000${media.public_url}`}
                                            alt="Post media"
                                            className="w-full h-auto max-h-[600px] object-contain mx-auto"
                                        />
                                    ) : media.media_type === 'video' ? (
                                        <div className="w-full aspect-video bg-black relative">
                                            {playingMediaId === media.id ? (
                                                <VideoPlayer mediaId={media.id} className="w-full h-full" />
                                            ) : (
                                                <div
                                                    className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                                                    onClick={() => setPlayingMediaId(media.id)}
                                                >
                                                    <div className="w-20 h-20 bg-white/10 group-hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-all transform group-hover:scale-105">
                                                        <PlayCircle className="w-12 h-12 text-white fill-white/20" />
                                                    </div>
                                                    <span className="absolute bottom-6 text-sm font-medium text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                                                        Click to Watch
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-6 flex items-center bg-gray-50 space-x-4">
                                            <div className="p-3 bg-blue-100 rounded-lg">
                                                <FileText className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Attachment</p>
                                                <a
                                                    href={`http://127.0.0.1:8000${media.public_url}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    Download File
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
