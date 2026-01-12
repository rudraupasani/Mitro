"use client";

import { Channel, Server } from "@/types";

interface ChannelSidebarProps {
    server: Server | undefined;
    channels: Channel[];
    activeChannel: string | null;
    previewChannel: string | null;
    onChannelClick: (id: string) => void;
    // User Controls Props
    username: string;
    isMuted: boolean;
    wantsVideo: boolean;
    isScreenSharing: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onToggleScreenShare: () => void;
    onLeaveChannel: () => void;
}

export default function ChannelSidebar({
    server,
    channels,
    activeChannel,
    previewChannel,
    onChannelClick,
    username,
    isMuted,
    wantsVideo,
    isScreenSharing,
    onToggleAudio,
    onToggleVideo,
    onToggleScreenShare,
    onLeaveChannel,
}: ChannelSidebarProps) {
    return (
        <div className="w-60 bg-[#2b2d31] flex flex-col z-10 shrink-0">
            {/* Header */}
            <header className="h-12 border-b border-[#1f2023] flex items-center px-4 font-bold shadow-sm cursor-pointer hover:bg-[#35373c] transition-colors">
                {server?.name}
            </header>

            {/* Channels */}
            <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                <div className="flex items-center justify-between px-2 text-xs font-bold text-gray-400 uppercase hover:text-gray-300 cursor-pointer pt-4 pb-2">
                    <span>Voice Channels</span>
                </div>
                {channels.map((channel) => (
                    <button
                        key={channel.id}
                        onClick={() => onChannelClick(channel.id)}
                        className={`w-full flex items-center px-2 py-1.5 rounded group transition-all text-gray-400 hover:text-gray-200 hover:bg-[#35373c]
                  ${activeChannel === channel.id ? "bg-[#3f4147] text-white" : ""}
                  ${previewChannel === channel.id ? "bg-[#35373c]/50" : ""}`}
                    >
                        <span className="text-xl mr-2 text-gray-500 group-hover:text-gray-300">🔊</span>
                        <span className={`truncate ${activeChannel === channel.id ? "font-medium" : ""}`}>
                            {channel.name}
                        </span>
                    </button>
                ))}
            </div>

            {/* User Controls */}
            <div className="h-[52px] bg-[#232428] px-2 flex items-center gap-2 mt-auto">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm relative shrink-0">
                    {username[0]?.toUpperCase()}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#232428] rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{username}</div>
                    <div className="text-xs text-gray-400 truncate">Online</div>
                </div>
                <button
                    onClick={onToggleAudio}
                    className={`p-1.5 rounded hover:bg-[#3f4147] ${isMuted ? "text-red-500 relative" : ""}`}
                    title="Toggle Mute"
                >
                    🎤
                    {isMuted && (
                        <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold transform rotate-45 text-lg pointer-events-none">
                            \
                        </div>
                    )}
                </button>
                <button
                    onClick={onToggleVideo}
                    className={`p-1.5 rounded hover:bg-[#3f4147] ${!wantsVideo ? "text-red-500 relative" : "text-green-500"}`}
                    title="Toggle Camera"
                >
                    📷
                    {!wantsVideo && (
                        <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold transform rotate-45 text-lg pointer-events-none">
                            \
                        </div>
                    )}
                </button>
                <button
                    onClick={onToggleScreenShare}
                    className={`p-1.5 rounded hover:bg-[#3f4147] ${isScreenSharing ? "text-green-500" : ""}`}
                    title="Share Screen"
                >
                    🖥️
                </button>
                {activeChannel && (
                    <button
                        onClick={onLeaveChannel}
                        className="p-1.5 rounded hover:bg-[#3f4147] text-red-500"
                        title="Disconnect"
                    >
                        📞
                    </button>
                )}
            </div>
        </div>
    );
}
