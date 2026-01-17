"use client";

import { useRef, useEffect } from "react";

interface VideoGridProps {
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    username: string;
    wantsVideo: boolean;
    isMuted: boolean;
}

export default function VideoGrid({
    localStream,
    remoteStreams,
    username,
    wantsVideo,
    isMuted,
}: VideoGridProps) {
    return (
        <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="w-full max-w-6xl grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] auto-rows-[400px]">
                {/* Local User */}
                <div className="bg-black rounded-xl overflow-hidden relative shadow-lg border border-gray-800 flex flex-col items-center justify-center group h-full">
                    {wantsVideo ? (
                        <VideoPlayer stream={localStream} muted={true} isVideoOff={false} />
                    ) : (
                        <>
                            <div
                                className={`w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-3xl mb-2 relative ${!isMuted ? "ring-4 ring-green-500" : ""}`}
                            >
                                {username[0]?.toUpperCase()}
                                {isMuted && (
                                    <div className="absolute bottom-0 right-0 bg-red-600 rounded-full p-1 border-4 border-black text-xs">
                                        🔇
                                    </div>
                                )}
                            </div>
                            <div className="font-bold text-lg">{username} (You)</div>
                            <div className="text-xs bg-green-400 h-2 w-2 rounded-full font-mono mt-1"></div>
                        </>
                    )}
                </div>

                {/* Remote Users */}
                {Array.from(remoteStreams.entries()).map(([peerId, stream]) => {
                    const hasVideo = stream.getVideoTracks().length > 0;
                    return (
                        <div
                            key={peerId}
                            className="bg-black rounded-xl overflow-hidden relative shadow-lg border border-gray-800 flex flex-col items-center justify-center h-full"
                        >
                            {hasVideo ? (
                                <VideoPlayer stream={stream} muted={false} isVideoOff={false} />
                            ) : (
                                <>
                                    <VideoPlayer stream={stream} muted={false} isVideoOff={true} />
                                    <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-3xl mb-2 relative ring-4 ring-green-500/50 animate-pulse">
                                        {peerId[0]?.toUpperCase()}
                                    </div>
                                    <div className="font-bold text-lg">{peerId.substring(0,5)}</div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Helper Component
function VideoPlayer({
    stream,
    muted,
    isVideoOff,
}: {
    stream: MediaStream | null;
    muted?: boolean;
    isVideoOff?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (videoEl && stream) {
            if (videoEl.srcObject !== stream) {
                videoEl.srcObject = stream;
                videoEl.onloadedmetadata = () => {
                    videoEl.play().catch((err) => {
                        if (err.name !== 'AbortError') {
                            console.error("Video playback failed:", err);
                        }
                    });
                };
            }
        }
    }, [stream]);

    // If video is off, we still render the element for audio, but make it invisible/tiny
    // Do NOT use display:none (className="hidden") as it can block audio in some browsers
    const styleClass = isVideoOff
        ? "opacity-0 absolute w-0 h-0 pointer-events-none"
        : "w-full h-full object-cover bg-[#202225]"; // Show video if on

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={styleClass}
        />
    );
}
