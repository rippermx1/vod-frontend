import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import MediaSelector from './MediaSelector';

interface MediaAttachModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentId: string;
    onAttached: () => void;
}

export default function MediaAttachModal({ isOpen, onClose, contentId, onAttached }: MediaAttachModalProps) {
    const handleAttach = async (mediaId: string) => {
        try {
            await api.post(`/cms/posts/${contentId}/attach/${mediaId}`);
            toast.success("Media attached successfully");
            onAttached();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to attach media");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-2xl bg-white shadow-xl border-emerald-500/20 max-h-[80vh] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Attach Media</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4">
                    <MediaSelector
                        onSelect={(media) => {
                            const selected = Array.isArray(media) ? media[0] : media;
                            handleAttach(selected.id);
                        }}
                    // MediaSelector doesn't have a 'selectedId' prop in the new version, 
                    // it uses 'selectedIds' array. But for this simple modal we likely don't need to show pre-selection
                    // or if we do, we need to adapt it. For now, basic functionality.
                    />
                </CardContent>
                <CardFooter className="justify-end bg-gray-50 p-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                </CardFooter>
            </Card>
        </div>
    );
}