import { useRef, useEffect, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import Hls from 'hls.js';
import { api } from '../../api/client';

interface MediaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string; // fallback or thumb
    type: 'image' | 'video';
    filename: string;
    mediaId?: string; // New Prop
}

export function MediaPreviewModal({ isOpen, onClose, url: initialUrl, type, filename, mediaId }: MediaPreviewModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [secureUrl, setSecureUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch Secure URL for Video
    useEffect(() => {
        if (!isOpen || type !== 'video' || !mediaId) {
            setSecureUrl(null);
            return;
        }

        const fetchSecureLink = async () => {
            setLoading(true);
            try {
                // 1. Get Token
                const tokenRes = await api.post('/delivery/token', { media_id: mediaId });
                const token = tokenRes.data.token;

                // 2. Get Secure URL (No Redirect)
                const secureRes = await api.get(`/delivery/secure/${mediaId}?token=${token}&noredirect=true`);
                setSecureUrl(secureRes.data.url);
            } catch (err) {
                console.error("Failed to load secure video:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSecureLink();
    }, [isOpen, type, mediaId]);

    // Initialize Player
    useEffect(() => {
        let hls: Hls | null = null;
        // Use secureUrl if available, otherwise fallback to initialUrl for images/public videos
        const src = secureUrl || initialUrl;

        if (isOpen && type === 'video' && videoRef.current && src) {
            const video = videoRef.current;
            const isHLS = src.includes('.m3u8');

            if (isHLS) {
                if (Hls.isSupported()) {
                    // Extract Token for Segments
                    const urlObj = new URL(src);
                    const authToken = urlObj.searchParams.get("Authorization");

                    hls = new Hls({
                        xhrSetup: (xhr, url) => {
                            // If requesting B2 and missing Auth, append it
                            // (Segments usually don't have query params)
                            if (authToken && url.includes('backblaze') && !url.includes('Authorization')) {
                                const separator = url.includes('?') ? '&' : '?';
                                xhr.open('GET', `${url}${separator}Authorization=${authToken}`);
                            }
                        }
                    });

                    hls.loadSource(src);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        video.play().catch(e => console.error("Auto-play failed:", e));
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    // Safari Native HLS
                    video.src = src;
                    video.addEventListener('loadedmetadata', () => {
                        video.play().catch(e => console.error("Auto-play failed:", e));
                    });
                }
            } else {
                // Standard video (mp4)
                video.src = src;
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch(e => console.error("Auto-play failed:", e));
                });
            }
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [isOpen, secureUrl, initialUrl, type]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            {/* Close Button */}
            <button
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/20 p-2 rounded-full hover:bg-black/40"
                onClick={onClose}
            >
                <X className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>

                {/* Content Container */}
                <div className="relative w-full flex items-center justify-center bg-black/50 rounded-lg overflow-hidden ring-1 ring-white/10 shadow-2xl min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center text-white/70">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <span>Loading secure stream...</span>
                        </div>
                    ) : type === 'image' ? (
                        <img
                            src={initialUrl}
                            alt={filename}
                            className="max-w-full max-h-[85vh] object-contain select-none"
                        />
                    ) : (
                        <div className="relative w-full aspect-video max-h-[85vh]">
                            <video
                                ref={videoRef}
                                controls
                                className="w-full h-full"
                                crossOrigin="anonymous"
                            />
                        </div>
                    )}
                </div>

                {/* Footer / Metadata */}
                <div className="mt-4 flex items-center justify-between w-full max-w-2xl px-4">
                    <div className="flex flex-col">
                        <span className="text-white font-medium truncate max-w-xs md:max-w-md text-lg">{filename}</span>
                        <span className="text-white/50 text-xs uppercase tracking-wider">{type}</span>
                    </div>

                    <a
                        href={secureUrl || initialUrl}
                        download={filename}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-md hover:bg-white/20"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm">Original</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
