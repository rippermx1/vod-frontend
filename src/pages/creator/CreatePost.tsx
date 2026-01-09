import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import PostEditor from '../../components/creator/PostEditor';

export default function CreatePost() {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Create New Post</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Post Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <PostEditor
                        onPublishSuccess={() => navigate('/creator/content')}
                        onSaveSuccess={(_post) => {
                            // Optionally redirect to edit mode or just stay here?
                            // User typically wants to continue editing, so maybe replace URL to edit mode?
                            // For now, let's keep them here but in "Edit" mode effectively
                            // But since this is a page, we don't have URL state easily unless we navigate.
                            // Let's navigate to content list for simplicity or stay.
                            // Better UX: Stay here, maybe show "Saved" toast (handled in component).
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}