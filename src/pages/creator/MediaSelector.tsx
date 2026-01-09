import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Video, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming you have a utils file or similar for class merging

interface Media {
    id: string;
    filename: string;
    media_type: 'image' | 'video';
    public_url: string;
    size_bytes: number;
    created_at: string;
    processing_status?: 'pending' | 'processing' | 'ready' | 'failed';
}

interface MediaSelectorProps {
    onSelect: (media: Media | Media[]) => void;
    selectedIds?: string[]; // Array for multi-select
    multiple?: boolean;
    filterType?: 'image' | 'video';
}

export default function MediaSelector({ onSelect, selectedIds = [], multiple = false, filterType }: MediaSelectorProps) {
    const [mediaItems, setMediaItems] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 20;

    useEffect(() => {
        fetchMedia();
    }, [page]);

    // Sync local state if props change (prevent infinite loop with value check)
    useEffect(() => {
        // Only update if the arrays are actually different in content
        const isDifferent =
            selectedIds.length !== localSelected.length ||
            !selectedIds.every((id) => localSelected.includes(id));

        if (isDifferent) {
            setLocalSelected(selectedIds);
        }
    }, [selectedIds]);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/cms/media?page=${page}&size=${pageSize}`);
            if (res.data.items) {
                // Append if implementing infinite scroll, or replace if pages
                // For selector, maybe append is better? Or simple pages? 
                // Let's stick to simple replacement + pagination buttons for consistency
                setMediaItems(res.data.items);
                setHasMore(page < res.data.pages);
            } else if (Array.isArray(res.data)) {
                setMediaItems(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (media: Media) => {
        let newSelected = [...localSelected];

        if (multiple) {
            if (newSelected.includes(media.id)) {
                newSelected = newSelected.filter(id => id !== media.id);
            } else {
                newSelected.push(media.id);
            }
        } else {
            // Single select toggle
            if (newSelected.includes(media.id)) {
                newSelected = [];
            } else {
                newSelected = [media.id];
            }
        }

        setLocalSelected(newSelected);

        // Notify parent
        if (multiple) {
            const selectedObjects = mediaItems.filter(m => newSelected.includes(m.id));
            onSelect(selectedObjects);
        } else {
            onSelect(media); // Single object for backward compat if needed, but safer to use array? 
            // Logic in CreatePost expects single object for handleAttach currently.
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading media library...</div>;
    }

    const displayedItems = filterType
        ? mediaItems.filter(item => item.media_type === filterType)
        : mediaItems;

    if (displayedItems.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                {filterType ? `No ${filterType}s found.` : "No media found. Upload some files first."}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[450px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto p-1 flex-1">
                {displayedItems.map((item) => {
                    const isSelected = localSelected.includes(item.id);
                    return (
                        <div key={item.id} className="group relative break-inside-avoid">
                            <Card
                                className={cn(
                                    "cursor-pointer transition-all border-2",
                                    isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-transparent hover:shadow-md"
                                )}
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden flex items-center justify-center relative">
                                    {item.media_type === 'image' ? (
                                        <img src={item.public_url} alt={item.filename} className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white relative">
                                            <Video className="w-12 h-12 text-gray-400" />
                                            {item.processing_status === 'processing' && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <span className="text-xs font-medium animate-pulse">Processing...</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 shadow-sm animate-in zoom-in duration-200">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-3">
                                    <p className="text-xs font-medium truncate" title={item.filename}>{item.filename}</p>
                                    <p className="text-[10px] text-gray-500">{(item.size_bytes / 1024 / 1024).toFixed(2)} MB</p>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center pt-4 border-t mt-2">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                    Previous
                </Button>
                <span className="text-xs text-gray-500">Page {page}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={!hasMore}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}