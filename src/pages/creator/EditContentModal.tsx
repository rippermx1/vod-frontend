import { X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PostEditor from '../../components/creator/PostEditor';

interface EditContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentId: string;
    onUpdated: () => void;
}

export default function EditContentModal({ isOpen, onClose, contentId, onUpdated }: EditContentModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-4xl bg-white shadow-xl border-emerald-500/20 max-h-[90vh] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <CardTitle>Manage Post</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6">
                    <PostEditor
                        postId={contentId}
                        onSaveSuccess={() => onUpdated()} // Refresh list in background
                        onPublishSuccess={() => {
                            onUpdated();
                            onClose();
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}