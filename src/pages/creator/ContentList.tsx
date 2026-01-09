import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash, Paperclip, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import EditContentModal from './EditContentModal';

interface Content {
    id: string;
    title: string;
    status: string;
    is_free: boolean;
    created_at: string;
    published_at?: string;
    tags?: string[];
    category?: string;
    cover_image_url?: string;
    media_items: any[];
}

export default function ContentList() {
    const [contents, setContents] = useState<Content[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/cms/posts');
            setContents(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await api.put(`/cms/posts/${id}`, { status: 'published' });
            toast.success("Post published!");
            fetchContent();
        } catch (error) {
            console.error(error);
            toast.error("Failed to publish post");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await api.delete(`/cms/posts/${id}`);
            toast.success("Post deleted");
            // Optimistically remove from list
            setContents(prev => prev.filter(p => p.id !== id));
            // fetchContent(); // No need to re-fetch immediately if we trust the delete
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete post");
        }
    };

    const openEditModal = (id: string) => {
        setSelectedPostId(id);
        setEditModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">My Content</h1>
                <Link to="/creator/content/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Post
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Posts</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : contents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No content yet. Create your first post!
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                                        <tr>
                                            <th className="px-6 py-3">Title</th>
                                            <th className="px-6 py-3">Media</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Access</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contents.map((content) => (
                                            <tr key={content.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <div>{content.title}</div>
                                                    {content.tags && content.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {content.tags.map((tag: string, i: number) => (
                                                                <span key={i} className="px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-600">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {content.category && (
                                                        <div className="text-xs text-emerald-600 mt-0.5 font-normal">
                                                            {content.category}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-2">
                                                        {content.media_items && content.media_items.slice(0, 3).map((item, i) => (
                                                            <div key={i} className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs" title={item.filename}>
                                                                {item.media_type === 'video' ? '🎬' : '📷'}
                                                            </div>
                                                        ))}
                                                        {content.media_items && content.media_items.length > 3 && (
                                                            <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                                                                +{content.media_items.length - 3}
                                                            </div>
                                                        )}
                                                        {(!content.media_items || content.media_items.length === 0) && (
                                                            <span className="text-gray-400 text-xs italic">No media</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {content.status === 'published' && content.published_at && new Date(content.published_at) > new Date() ? (
                                                        <div className="flex flex-col">
                                                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-1">
                                                                Scheduled
                                                            </Badge>
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                {new Date(content.published_at).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Badge variant={content.status === 'published' ? 'success' : 'secondary'}>
                                                            {content.status === 'published' ? 'Published' : content.status}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={content.is_free ? 'default' : 'warning'}>
                                                        {content.is_free ? 'Free' : 'Premium'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {new Date(content.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 flex space-x-2 justify-end">
                                                    {content.status === 'draft' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Publish"
                                                                onClick={() => handlePublish(content.id)}
                                                            >
                                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Attach Media"
                                                                onClick={() => openEditModal(content.id)}
                                                            >
                                                                <Paperclip className="h-4 w-4 text-blue-500" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="View/Edit"
                                                        onClick={() => openEditModal(content.id)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Delete"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(content.id)}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List */}
                            <div className="md:hidden space-y-4">
                                {contents.map((content) => (
                                    <div key={content.id} className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium text-gray-900 line-clamp-1">{content.title}</h3>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(content.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <Badge variant={content.status === 'published' ? 'success' : 'secondary'}>
                                                {content.status}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={content.is_free ? 'default' : 'warning'} className="text-[10px] h-5 px-1.5">
                                                    {content.is_free ? 'Free' : 'Premium'}
                                                </Badge>
                                                {content.category && (
                                                    <span className="text-xs text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full">
                                                        {content.category}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex -space-x-1">
                                                {content.media_items?.slice(0, 3).map((item, i) => (
                                                    <div key={i} className="h-6 w-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px]">
                                                        {item.media_type === 'video' ? '🎬' : '📷'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t flex justify-end gap-2">
                                            {content.status === 'draft' && (
                                                <Button size="sm" variant="ghost" onClick={() => handlePublish(content.id)} className="h-8 px-2 text-emerald-600">
                                                    Publish
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" onClick={() => openEditModal(content.id)} className="h-8">
                                                Edit
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(content.id)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {selectedPostId && (
                <EditContentModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    contentId={selectedPostId}
                    onUpdated={fetchContent}
                />
            )}
        </div>
    );
}