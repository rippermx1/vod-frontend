import { useState } from 'react';
import { useB2Upload } from '../../hooks/useB2Upload';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';

interface UploadItem {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
    preview?: string;
}

export default function UploadMedia() {
    const [files, setFiles] = useState<UploadItem[]>([]);
    const { uploadFile } = useB2Upload();

    const handleFiles = (fileList: FileList) => {
        const validFiles = Array.from(fileList).filter(file => {
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                toast.error(`Skipped "${file.name}": Only images and videos are allowed.`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        const newFiles: UploadItem[] = validFiles.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            progress: 0,
            status: 'pending',
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
        // Reset input
        e.target.value = '';
    };

    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    // ... (removeFile and handleUploadAll remain same)


    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleUploadAll = async () => {
        // Upload pending files
        const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');

        // We could do parallel, but for now lets do sequential or limited parallel for simplicity
        // Let's simple map with concurrency
        await Promise.all(pendingFiles.map(async (item) => {
            // Update status to uploading
            setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f));

            const { success, error } = await uploadFile(item.file, (percent) => {
                setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: percent } : f));
            });

            if (success) {
                setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'completed', progress: 100 } : f));
            } else {
                setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error } : f));
            }
        }));
        toast.success('Queue processing finished');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Upload Media</h1>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Select Files</CardTitle>
                        <span className="text-sm text-gray-500">{files.length} files selected</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-center w-full" onDragEnter={handleDrag}>
                        <label
                            htmlFor="dropzone-file"
                            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className={`w-10 h-10 mb-3 ${dragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500">Videos, Images (Multiple allowed)</p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" multiple onChange={handleFileChange} accept="image/*,video/*" />
                        </label>
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex justify-end">
                                <Button onClick={handleUploadAll} disabled={files.every(f => f.status === 'completed')}>
                                    {files.some(f => f.status === 'uploading') ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                                        </>
                                    ) : (
                                        'Upload All Pending'
                                    )}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {files.map(file => (
                                    <div key={file.id} className="flex items-center p-3 bg-white border rounded-lg shadow-sm">
                                        {/* Preview / Icon */}
                                        <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center mr-4">
                                            {file.preview ? (
                                                <img src={file.preview} className="h-full w-full object-cover" alt="" />
                                            ) : (
                                                <VideoIcon />
                                            )}
                                        </div>

                                        {/* info */}
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex justify-between mb-1">
                                                <p className="text-sm font-medium truncate">{file.file.name}</p>
                                                <span className={`text-xs capitalize ${file.status === 'completed' ? 'text-green-500' : file.status === 'error' ? 'text-red-500' : 'text-gray-500'
                                                    }`}>
                                                    {file.status === 'error' ? 'Failed' : file.status}
                                                </span>
                                            </div>

                                            {/* Progress */}
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${file.status === 'error' ? 'bg-red-500' : file.status === 'completed' ? 'bg-green-500' : 'bg-indigo-600'
                                                        }`}
                                                    style={{ width: `${file.progress}%` }}
                                                ></div>
                                            </div>
                                            {file.error && <p className="text-xs text-red-500 mt-1">{file.error}</p>}
                                        </div>

                                        {/* Actions */}
                                        <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)} disabled={file.status === 'uploading'}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function VideoIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
    )
}