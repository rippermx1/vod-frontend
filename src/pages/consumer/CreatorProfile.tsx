
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { VideoPlayer } from '../../components/VideoPlayer';

interface Creator {
    id: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    kyc_status?: string;
    is_subscribed?: boolean;
    avatar_url?: string;
}

interface MediaItem {
    id: string;
    filename: string;
    public_url: string;
    media_type: 'video' | 'image' | 'document';
}

interface Post {
    id: string;
    title: string;
    description: string;
    is_free: boolean;
    status: string;
    created_at: string;
    media_items: MediaItem[];
    cover_image_url?: string;
}

// Helper for API URL
const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export default function CreatorProfile() {
    const { creatorId } = useParams<{ creatorId: string }>();
    const [creator, setCreator] = useState<Creator | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        if (creatorId) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [creatorId]);

    const fetchData = async () => {
        if (!creatorId) return;
        setIsLoading(true);
        try {
            const [creatorRes, postsRes] = await Promise.all([
                api.get(`/creators/${creatorId}`),
                api.get(`/cms/creator/${creatorId}/posts`)
            ]);
            setCreator(creatorRes.data);
            setPosts(postsRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load creator profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!creatorId) return;
        setIsSubscribing(true);
        try {
            // Check if already subscribed? Backend handles logic, returns existing.
            const res = await api.post(`/subscriptions/${creatorId}`);
            const sub = res.data;
            if (sub.status === 'active') {
                toast.success('You are already subscribed!');
            } else {
                navigate(`/subscribe/${sub.id}`);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to start subscription');
        } finally {
            setIsSubscribing(false);
        }
    };

    if (isLoading) return <div className="text-center py-10">Loading...</div>;
    if (!creator) return <div className="text-center py-10">Creator not found</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header / Bio */}
            <Card>
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6 text-center md:text-left">
                    <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-gray-100">
                        {creator.avatar_url ? (
                            <img
                                src={`${getApiUrl()}/creators/${creator.id}/avatar`}
                                alt={creator.full_name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-avatar.png'; }} // Fallback
                            />
                        ) : (
                            <User className="h-12 w-12 text-primary" />
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                            <h1 className="text-3xl font-bold text-foreground">{creator.full_name || 'Creator'}</h1>
                            {creator.kyc_status === 'verified' && (
                                <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full text-xs font-semibold border border-blue-200">
                                    <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Verified</span>
                                </div>
                            )}
                        </div>
                        <p className="text-muted-foreground">{creator.email}</p>
                        <p className="text-sm text-foreground/80 max-w-2xl">
                            Welcome to my exclusive content channel. Subscribe to get access to premium videos and updates.
                        </p>
                    </div>
                    <div className="flex flex-col space-y-2 items-end">
                        {creator.is_subscribed ? (
                            <div className="flex flex-col items-end">
                                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-semibold text-sm border border-emerald-200 flex items-center shadow-sm">
                                    <svg className="w-4 h-4 mr-1.5 fill-current" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Subscribed
                                </span>
                                <p className="text-xs text-muted-foreground mt-2">Access to all premium content</p>
                            </div>
                        ) : (
                            <Button size="lg" onClick={handleSubscribe} disabled={isSubscribing} className="shadow-lg hover:shadow-xl transition-all">
                                {isSubscribing ? 'Processing...' : 'Subscribe'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Posts Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Latest Posts</h2>
                {posts.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                        No posts yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-video bg-gray-200 flex items-center justify-center relative">
                                    {post.cover_image_url ? (
                                        <img
                                            src={`${getApiUrl()}/delivery/cover/${post.id}`}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : post.media_items && post.media_items.length > 0 ? (
                                        post.media_items[0].media_type === 'video' ? (
                                            <VideoPlayer
                                                mediaId={post.media_items[0].id}
                                                isLocked={!post.is_free && creator?.id !== 'owner'} // Simplified lock logic
                                                className="w-full h-full"
                                            />
                                        ) : post.media_items[0].media_type === 'image' ? (
                                            <img
                                                src={`http://127.0.0.1:8000${post.media_items[0].public_url}`}
                                                alt={post.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-gray-400">Preview Unsupported</div>
                                        )
                                    ) : (
                                        <div className="text-gray-400">No Media</div>
                                    )}
                                </div>
                                <CardContent className="p-4 space-y-2">
                                    <h3 className="font-semibold truncate text-foreground">{post.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
                                    <div className="pt-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => navigate(`/post/${post.id}`)}
                                        >
                                            {post.is_free ? 'View Now' : 'Unlock'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}