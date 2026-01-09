
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';
import { User, Search, Heart, Play } from 'lucide-react';

interface Creator {
    id: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    kyc_status: string;
    avatar_url?: string;
    likes_count: number;
    is_liked: boolean; // Note: Requires auth context in list (not yet implemented fully in backend list but planned)
}

export default function Explore() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Local state for likes to react instantly
    const [likedCreators, setLikedCreators] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchCreators();
    }, []);

    const fetchCreators = async () => {
        try {
            const res = await api.get('/creators');
            setCreators(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load creators');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (e: React.MouseEvent, creator: Creator) => {
        e.preventDefault(); // Prevent navigation if button is inside link area
        e.stopPropagation();

        const isLiked = likedCreators.has(creator.id);
        const endpoint = `/creators/${creator.id}/like`;

        // Optimistic UI update
        const newLikes = new Set(likedCreators);
        if (isLiked) {
            newLikes.delete(creator.id);
            setCreators(creators.map(c => c.id === creator.id ? { ...c, likes_count: c.likes_count - 1 } : c));
        } else {
            newLikes.add(creator.id);
            setCreators(creators.map(c => c.id === creator.id ? { ...c, likes_count: c.likes_count + 1 } : c));
        }
        setLikedCreators(newLikes);

        try {
            if (isLiked) {
                await api.delete(endpoint);
            } else {
                await api.post(endpoint, {});
            }
        } catch (error) {
            console.error("Like failed", error);
            toast.error("Action failed");
            // Revert on failure would be nice here, but skipping for MVP speed
        }
    };

    const filteredCreators = creators.filter(c =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 border-b">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Explore Creators</h1>
                    <p className="text-muted-foreground mt-1">
                        Discover talented creators and exclusive content.
                    </p>
                </div>

                {/* Compact Search */}
                <div className="w-full md:w-72 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="pl-9 bg-white/50 focus:bg-white transition-colors"
                    />
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
            ) : filteredCreators.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50/50 rounded-xl border border-dashed">
                    <User className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <h3 className="text-base font-medium">No creators found matching "{searchTerm}"</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredCreators.map((creator) => (
                        <Link to={`/creator/${creator.id}`} key={creator.id} className="group block h-full">
                            <Card className="relative h-full border border-gray-100 bg-white hover:border-indigo-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">

                                {/* Header / Cover Gradient */}
                                <div className="h-24 bg-gradient-to-br from-indigo-50 to-purple-50 relative group-hover:from-indigo-100 group-hover:to-purple-100 transition-colors">
                                    {/* Like Button (Top Right) */}
                                    <button
                                        onClick={(e) => handleLike(e, creator)}
                                        className="absolute top-2 right-2 p-2 rounded-full bg-white/60 hover:bg-white text-gray-400 hover:text-pink-500 transition-all shadow-sm z-10"
                                    >
                                        <Heart className={`h-4 w-4 ${likedCreators.has(creator.id) ? "fill-pink-500 text-pink-500" : ""}`} />
                                    </button>
                                </div>

                                <CardContent className="pt-0 p-5 flex flex-col items-center -mt-10 relative">
                                    {/* Avatar */}
                                    <div className="h-20 w-20 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden mb-3 group-hover:shadow-md transition-shadow">
                                        {creator.avatar_url ? (
                                            <img src={creator.avatar_url} alt={creator.full_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-300">
                                                <User className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="text-center w-full mb-4">
                                        <h3 className="font-semibold text-lg text-gray-900 truncate px-2">
                                            {creator.full_name || 'Anonymous'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground truncate">{creator.email}</p>
                                    </div>

                                    {/* Stats / Action */}
                                    <div className="mt-auto w-full pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center">
                                            <Heart className="h-3 w-3 mr-1 text-pink-400" />
                                            {creator.likes_count} Likes
                                        </div>
                                        <div className="group-hover:text-indigo-600 font-medium transition-colors flex items-center">
                                            Visit <Play className="h-3 w-3 ml-1 fill-current" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}