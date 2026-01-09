import { useState, useEffect, useRef } from 'react';
import { useNotificationStream } from '../../hooks/useNotificationStream';
import { api } from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Trash, Eye, Video, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MediaPreviewModal } from '../../components/media/MediaPreviewModal';

interface MediaItem {
    id: string;
    filename: string;
    media_type: 'image' | 'video';
    public_url: string;
    size_bytes: number;
    created_at: string;
    processing_status?: 'pending' | 'processing' | 'ready' | 'failed';
}

export default function MediaLibrary() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
    const [currentPage, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pageSize = 20;

    useEffect(() => {
        fetchMedia();
    }, [currentPage]);

    // Use Real-time Notifications
    const { notifications } = useNotificationStream();

    // Refresh when a new notification comes in (debounced or simple check)
    useEffect(() => {
        if (notifications.length > 0) {
            // Check if latest notification is relevant?
            // For now, simpler: refresh invalidates cache. 
            // Better: only refresh if we see a "Media Ready" message
            const latest = notifications[0];
            if (latest.title.includes("Media") || latest.resource_type === 'media') {
                fetchMedia(true);
            }
        }
    }, [notifications]);

    // Cleanup: Removed Polling
    /* 
    Legacy Polling removed in favor of SSE.
    If you see issues with updates, refresh manualy.
    */

    const fetchMedia = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const res = await api.get(`/cms/media?page=${currentPage}&size=${pageSize}`);
            if (res.data.items) {
                setMedia(res.data.items);
                setTotalPages(res.data.pages);
            } else if (Array.isArray(res.data)) {
                setMedia(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch media:", error);
            if (!silent) toast.error("Failed to load media library");
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate File Type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            toast.error("Invalid file type. Only images and videos are allowed.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        formData.append('media_type', mediaType);

        try {
            // Using simple upload for MVP. 
            // In Production, this should use useB2Upload (upload-intent) for large files.
            await api.post('/cms/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("File uploaded successfully");
            fetchMedia();
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this file?")) return;
        try {
            await api.delete(`/cms/media/${id}`);
            setMedia(prev => prev.filter(m => m.id !== id));
            toast.success("File deleted");
        } catch (error) {
            toast.error("Failed to delete file");
        }
    };

    const formatSize = (bytes: number) => {
        if (!bytes || isNaN(bytes)) return "0 B";
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,video/*"
                    />
                    <Button onClick={handleUploadClick} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Upload Media
                    </Button>
                    <Button onClick={() => fetchMedia()} variant="ghost" size="sm">Refresh</Button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10">Loading...</div>
            ) : media.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <p>No media uploaded yet.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {media.map((item) => (
                            <div key={item.id} className="group relative break-inside-avoid">
                                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPreviewItem(item)}>
                                    <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden flex items-center justify-center relative">
                                        {item.media_type === 'image' ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}/cms/media/${item.id}/preview?token_query=${localStorage.getItem('access_token')}`}
                                                alt={item.filename}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                loading="lazy"
                                                onError={(e) => {
                                                    // Fallback to public URL if preview fails (e.g. mock mode)
                                                    e.currentTarget.src = item.public_url;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 relative group-hover:bg-gray-200 transition-colors">
                                                {/* Try to show poster if available, else icon */}
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL}/cms/media/${item.id}/preview?token_query=${localStorage.getItem('access_token')}`}
                                                    alt={item.filename}
                                                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                <Video className="w-12 h-12 text-gray-400 z-10" />
                                                {(item.processing_status === 'processing' || item.processing_status === 'pending') && (
                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                                                        <Loader2 className="h-6 w-6 text-white animate-spin mb-2" />
                                                        <span className="text-xs text-white font-medium">Processing</span>
                                                    </div>
                                                )}
                                                {item.processing_status === 'failed' && (
                                                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center z-10">
                                                        <span className="text-xs text-white font-medium">Failed</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={(e) => handleDelete(item.id, e)}>
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardContent className="p-3">
                                        <p className="text-xs font-medium truncate" title={item.filename}>{item.filename}</p>
                                        <p className="text-[10px] text-gray-500">{formatSize(item.size_bytes)}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}

            <MediaPreviewModal
                isOpen={!!previewItem}
                onClose={() => setPreviewItem(null)}
                url={previewItem?.media_type === 'image'
                    ? `${import.meta.env.VITE_API_URL}/cms/media/${previewItem.id}/preview?token_query=${localStorage.getItem('access_token')}`
                    : previewItem?.public_url || ''}
                type={previewItem?.media_type || 'image'}
                filename={previewItem?.filename || 'File'}
                mediaId={previewItem?.id}
            />
        </div>
    );
}