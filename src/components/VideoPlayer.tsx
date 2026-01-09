
import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { Button } from './ui/Button';
import { Play, Lock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Hls from 'hls.js';

interface VideoPlayerProps {
    mediaId: string;
    posterUrl?: string; // Optional poster/thumbnail
    className?: string;
    isLocked?: boolean; // If we know upfront it's locked
}

export function VideoPlayer({ mediaId, posterUrl, className, isLocked }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // Cleanup HLS on unmount
    useEffect(() => {
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, []);

    const handlePlay = async () => {
        if (isLocked) {
            toast.error("This content requires a subscription.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch Token
            const resToken = await api.post('/playback/token', { media_id: mediaId });
            const { token: playbackToken } = resToken.data;

            // 2. Get B2 Signed URL (No Redirect)
            // We need the actual B2 URL to extract the 'Authorization' param for HLS segments
            const secureRes = await api.get(`/playback/secure/${mediaId}`, {
                params: {
                    token: playbackToken,
                    noredirect: true
                }
            });
            const streamUrl = secureRes.data.url;

            setIsPlaying(true);

            // 3. Initialize Player
            setTimeout(() => {
                const video = videoRef.current;
                if (!video) return;

                // Extract Authorization token from B2 URL
                // Format: https://.../file/...?Authorization=...
                const urlObj = new URL(streamUrl);
                const b2AuthToken = urlObj.searchParams.get('Authorization');

                if (Hls.isSupported()) {
                    const hls = new Hls({
                        xhrSetup: function (xhr, url) {
                            // Only append if it's a B2 request (simple check) and missing token
                            // And ONLY for segments/playlists relative to the master
                            // Actually, safest is to append to ALL if domain matches?
                            // Or just blindly append if missing?

                            // B2 requires the SAME token for segments (if authorized by prefix)
                            if (b2AuthToken && !url.includes('Authorization=')) {
                                const separator = url.includes('?') ? '&' : '?';
                                xhr.open('GET', url + separator + 'Authorization=' + b2AuthToken);
                            }
                        }
                    });

                    hlsRef.current = hls;
                    hls.loadSource(streamUrl);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        video.play().catch(e => console.error("Autoplay failed", e));
                        setIsLoading(false);
                    });

                    hls.on(Hls.Events.ERROR, (_event, data) => {
                        if (data.fatal) {
                            console.error("HLS Fatal Error", data);
                            setIsLoading(false);
                            // Differentiate errors?
                            setError("Playback failed (Stream Error).");
                            hls.destroy();
                        }
                    });
                }
                else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    // Native HLS (Safari)
                    // Safari handles Master Playlist with token.
                    // BUT it does NOT handle relative segments automatically getting the token usually.
                    // However, B2 presigned URLs usually need the token on segments.
                    // Safari might fail here if segments are private.
                    // Workaround for Safari: We can't inject headers/params into native player.
                    // B2 MUST support Cookie auth or we must Proxy.
                    // OR: User mentioned "For Consumer", usually desktop/mobile Chrome.
                    // Let's rely on HLS.js for now.
                    // If Safari fails, we fall back to generic error or MP4 if available?
                    // We'll set src directly and hope B2 token is sticky (unlikely) or valid for "directory" ?
                    // Actually, if we pass the token in the master URL, some CDNs use cookies. B2 doesn't.
                    // For Safari, we might be stuck without a Proxy. 
                    // Let's try native load.
                    video.src = streamUrl;
                    video.addEventListener('loadedmetadata', () => {
                        video.play().catch(e => console.error(e));
                        setIsLoading(false);
                    });
                    video.addEventListener('error', () => {
                        setError("Playback failed (Native).");
                        setIsLoading(false);
                    });
                } else {
                    setError("HLS not supported in this browser.");
                    setIsLoading(false);
                }
            }, 100);

        } catch (err: any) {
            console.error("Playback error:", err);
            setIsLoading(false);
            if (err.response?.status === 403) {
                setError("Access Denied. Please subscribe to watch.");
            } else {
                setError("Failed to load video.");
            }
        }
    };

    if (error) {
        return (
            <div className={`bg-gray-900 text-white flex flex-col items-center justify-center aspect-video rounded-md ${className}`}>
                <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                <p className="font-medium text-sm">{error}</p>
                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="mt-2 text-white hover:bg-white/20">
                    Try Again
                </Button>
            </div>
        );
    }

    if (isPlaying) {
        return (
            <div className={`relative bg-black rounded-md overflow-hidden aspect-video ${className}`}>
                <video
                    ref={videoRef}
                    controls
                    className="w-full h-full"
                    controlsList="nodownload"
                    playsInline
                />
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <Loader2 className="h-12 w-12 text-white animate-spin" />
                    </div>
                )}
            </div>
        );
    }

    // Poster / Locked State (Same as before)
    return (
        <div className={`relative bg-gray-200 rounded-md overflow-hidden aspect-video group ${className}`}>
            {posterUrl && (
                <img
                    src={posterUrl}
                    alt="Video Poster"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                />
            )}

            <div className="absolute inset-0 flex items-center justify-center">
                {isLoading ? (
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                ) : isLocked ? (
                    <div className="bg-black/60 p-4 rounded-full backdrop-blur-sm">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                ) : (
                    <button
                        onClick={handlePlay}
                        className="bg-white/20 hover:bg-white/30 p-4 rounded-full backdrop-blur-sm transition-all transform group-hover:scale-110"
                    >
                        <Play className="h-8 w-8 text-white fill-white" />
                    </button>
                )}
            </div>

            {isLocked && (
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
                    <Lock className="w-3 h-3 mr-1" /> Premium
                </div>
            )}
        </div>
    );
}