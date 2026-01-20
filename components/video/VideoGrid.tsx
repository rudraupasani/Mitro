"use client";

import { useRef, useEffect, useState } from "react";
import { User, Mic, MicOff, Video as VideoIcon, Crown } from "lucide-react";

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
    const totalUsers = 1 + remoteStreams.size;

    // Responsive grid columns based on user count
    const gridCols = totalUsers === 1
        ? "grid-cols-1"
        : totalUsers === 2
            ? "grid-cols-1 md:grid-cols-2"
            : totalUsers === 3
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

    return (
        <div className="flex-1 flex items-center justify-center min-h-0 p-4">
            <div className={`w-full h-full grid gap-3 ${gridCols} auto-rows-fr`}>
                {/* Local User */}
                <UserCard
                    stream={localStream}
                    username={username}
                    isLocal={true}
                    isMuted={isMuted}
                    hasVideo={wantsVideo}
                />

                {/* Remote Users */}
                {Array.from(remoteStreams.entries()).map(([peerId, stream]) => {
                    const hasVideo = stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
                    return (
                        <UserCard
                            key={peerId}
                            stream={stream}
                            username={peerId.substring(0, 8)}
                            isLocal={false}
                            isMuted={false}
                            hasVideo={hasVideo}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// User Card Component
function UserCard({
    stream,
    username,
    isLocal,
    isMuted,
    hasVideo,
}: {
    stream: MediaStream | null;
    username: string;
    isLocal: boolean;
    isMuted: boolean;
    hasVideo: boolean;
}) {
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Speaking detection
    useEffect(() => {
        if (!stream || isLocal) return;

        // Check if stream has audio tracks before creating AudioContext
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            console.log('⚠️ Stream has no audio tracks, skipping speaking detection');
            return;
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;
        microphone.connect(analyser);

        const detectSpeaking = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setIsSpeaking(average > 10);
            requestAnimationFrame(detectSpeaking);
        };

        detectSpeaking();

        return () => {
            microphone.disconnect();
            audioContext.close();
        };
    }, [stream, isLocal]);

    return (
        <div className={`
            relative rounded-lg overflow-hidden bg-[#1e1f22] 
            border-2 transition-all duration-200
            ${isSpeaking ? 'border-[#23a559] shadow-lg shadow-[#23a559]/20' : 'border-[#26272d]'}
            ${hasVideo ? '' : 'flex items-center justify-center'}
            min-h-[200px] md:min-h-[250px] lg:min-h-[300px]
        `}>
            {/* Video Player - Always rendered for audio */}
            <VideoPlayer
                stream={stream}
                muted={isLocal}
                isVideoOff={!hasVideo}
            />

            {/* Avatar Overlay (when video is off) */}
            {!hasVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#2b2d31] to-[#1e1f22] z-10">
                    <div className={`
                        w-20 h-20 md:w-24 md:h-24 rounded-full 
                        flex items-center justify-center text-2xl md:text-3xl font-bold
                        bg-gradient-to-br from-[#5865f2] to-[#3c45a5]
                        ${isSpeaking ? 'ring-4 ring-[#23a559] animate-pulse' : ''}
                        transition-all duration-200
                    `}>
                        <User className="w-10 h-10 md:w-12 md:h-12" />
                    </div>
                    <div className="mt-4 text-center">
                        <div className="font-semibold text-base md:text-lg text-[#f2f3f5] flex items-center gap-2 justify-center">
                            {username}
                            {isLocal && <span className="text-xs text-[#b5bac1]">(You)</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* User Info Overlay (when video is on) */}
            {hasVideo && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold text-sm text-white flex items-center gap-1">
                                {username}
                                {isLocal && <span className="text-xs text-gray-300">(You)</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {isMuted ? (
                                <div className="bg-[#f23f43] rounded-full p-1.5">
                                    <MicOff className="w-3 h-3 text-white" />
                                </div>
                            ) : isSpeaking ? (
                                <div className="bg-[#23a559] rounded-full p-1.5 animate-pulse">
                                    <Mic className="w-3 h-3 text-white" />
                                </div>
                            ) : (
                                <div className="bg-[#313338] rounded-full p-1.5">
                                    <Mic className="w-3 h-3 text-[#b5bac1]" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mute Indicator (when video is off) */}
            {!hasVideo && (
                <div className="absolute top-3 right-3 z-20">
                    {isMuted ? (
                        <div className="bg-[#f23f43] rounded-full p-2 shadow-lg">
                            <MicOff className="w-4 h-4 text-white" />
                        </div>
                    ) : isSpeaking ? (
                        <div className="bg-[#23a559] rounded-full p-2 shadow-lg animate-pulse">
                            <Mic className="w-4 h-4 text-white" />
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

// Video Player Component
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
                console.log(`🎥 Setting stream, muted: ${muted}, videoOff: ${isVideoOff}`);
                videoEl.srcObject = stream;

                // CRITICAL: Ensure audio tracks are enabled for remote streams
                if (!muted) {
                    stream.getAudioTracks().forEach(track => {
                        console.log(`🔊 Audio track enabled: ${track.enabled}, readyState: ${track.readyState}`);
                        track.enabled = true;
                    });
                }

                videoEl.onloadedmetadata = () => {
                    videoEl.play().catch((err) => {
                        if (err.name !== 'AbortError') {
                            console.error("Video playback failed:", err);
                        }
                    });
                };
            }
        }
    }, [stream, muted, isVideoOff]);

    // CRITICAL FIX: Keep video element in DOM for audio playback
    // Use opacity-0 instead of display:none to ensure audio plays
    const styleClass = isVideoOff
        ? "absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        : "absolute inset-0 w-full h-full object-cover";

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
