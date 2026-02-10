"use client";

import {
    Menu,
    Mic,
    MicOff,
    Video,
    VideoOff,
    MessageCircle,
    PhoneOff,
    Settings
} from "lucide-react";

interface MobileBottomBarProps {
    username: string;
    isMuted: boolean;
    wantsVideo: boolean;
    isScreenSharing: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onToggleScreenShare: () => void;
    onOpenSettings: () => void;
    onToggleMenu: () => void;
    onToggleChat: () => void;
    activeChannel: string | null;
    onLeaveChannel: () => void;
}

export default function MobileBottomBar({
    isMuted,
    wantsVideo,
    onToggleAudio,
    onToggleVideo,
    onOpenSettings,
    onToggleMenu,
    onToggleChat,
    activeChannel,
    onLeaveChannel
}: MobileBottomBarProps) {
    return (
        <div className="md:hidden bottom-150 h-16 bg-[#232428]/95 backdrop-blur border-t border-[#1f2023] px-4 flex items-center justify-between z-50">

            {/* Menu */}
            <button
                onClick={onToggleMenu}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white"
            >
                <Menu size={22} />
                <span className="text-[10px]">Menu</span>
            </button>

            {/* Mic */}
            <button
                onClick={onToggleAudio}
                className={`flex flex-col items-center gap-1 ${isMuted ? "text-red-500" : "text-gray-300 hover:text-white"
                    }`}
            >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                <span className="text-[10px]">
                    {isMuted ? "Unmute" : "Mute"}
                </span>
            </button>

            {/* Video */}
            <button
                onClick={onToggleVideo}
                className={`flex flex-col items-center gap-1 ${wantsVideo ? "text-green-500" : "text-red-500"
                    }`}
            >
                {wantsVideo ? <Video size={22} /> : <VideoOff size={22} />}
                <span className="text-[10px]">Video</span>
            </button>

            {/* Chat */}
            {activeChannel && (
                <button
                    onClick={onToggleChat}
                    className="flex flex-col items-center gap-1 text-gray-300 hover:text-white"
                >
                    <MessageCircle size={22} />
                    <span className="text-[10px]">Chat</span>
                </button>
            )}

            {/* End / Settings */}
            {activeChannel ? (
                <button
                    onClick={onLeaveChannel}
                    className="flex flex-col items-center gap-1 text-red-500"
                >
                    <PhoneOff size={22} />
                    <span className="text-[10px]">End</span>
                </button>
            ) : (
                <button
                    onClick={onOpenSettings}
                    className="flex flex-col items-center gap-1 text-gray-300 hover:text-white"
                >
                    <Settings size={22} />
                    <span className="text-[10px]">User</span>
                </button>
            )}
        </div>
    );
}
