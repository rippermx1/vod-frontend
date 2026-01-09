
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, PlayCircle, FileText, Lock } from 'lucide-react';
import { VideoPlayer } from '../../components/VideoPlayer';

interface Media {
    id: string;
    media_type: string;
    public_url: string; // For images
    processing_status: string;
}

interface Post {
    id: string;
    title: string;
    description: string;
    is_free: boolean;
    media_items: Media[];
    published_at: string;
    creator_id: string;
}

export default function Feed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Track which video is playing
    const [playingMediaId, setPlayingMediaId] = useState<string | null>(null);

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/cms/feed');
            setPosts(res.data);
        } catch (error) {
            console.error("Failed to load feed", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-emerald-500" /></div>;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Your Feed</h1>

            {posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No posts from your subscriptions yet.</p>
                    <p className="text-gray-400 text-sm mt-2">Subscribe to creators in Explore to see content here.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {posts.map(post => (
                        <Card key={post.id} className="overflow-hidden bg-white border-zinc-200">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl text-slate-900">{post.title}</CardTitle>
                                        <p className="text-sm text-gray-500 mt-1">{new Date(post.published_at).toLocaleDateString()} • Creator {post.creator_id.slice(0, 6)}...</p>
                                    </div>
                                    {!post.is_free && <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium flex items-center"><Lock className="w-3 h-3 mr-1" /> Subscriber Only</div>}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {post.description && <p className="text-gray-700 whitespace-pre-wrap">{post.description}</p>}

                                <div className="grid gap-4">
                                    {post.media_items.map(media => (
                                        <div key={media.id} className="rounded-lg overflow-hidden bg-black/5 border border-zinc-200">
                                            {media.media_type === 'image' ? (
                                                <img src={`http://127.0.0.1:8000${media.public_url}`} alt="Post media" className="w-full h-auto max-h-96 object-contain bg-black" />
                                            ) : media.media_type === 'video' ? (
                                                <div className="w-full aspect-video bg-black relative">
                                                    {playingMediaId === media.id ? (
                                                        <VideoPlayer mediaId={media.id} />
                                                    ) : (
                                                        <div
                                                            className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                                                            onClick={() => setPlayingMediaId(media.id)}
                                                        >
                                                            <div className="w-16 h-16 bg-white/10 group-hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-all">
                                                                <PlayCircle className="w-10 h-10 text-white fill-white/20" />
                                                            </div>
                                                            <span className="absolute bottom-4 right-4 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                                                                Click to Play
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-4 flex items-center space-x-3">
                                                    <FileText className="text-gray-500" />
                                                    <a href={`http://127.0.0.1:8000${media.public_url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                        Download Attachment
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}