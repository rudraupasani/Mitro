"use client";

import { useState } from "react";
import { Channel, Server } from "@/types";
import {
    Volume2,
    Mic,
    MicOff,
    Video,
    VideoOff,
    MonitorUp,
    PhoneOff,
    Settings,
    Menu,
    X,
    House
} from "lucide-react";

interface ChannelSidebarProps {
    server: Server | undefined;
    channels: Channel[];
    activeChannel: string | null;
    previewChannel: string | null;
    onChannelClick: (id: string) => void;

    username: string;
    isMuted: boolean;
    wantsVideo: boolean;
    isScreenSharing: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onToggleScreenShare: () => void;
    onLeaveChannel: () => void;
    onOpenSettings?: () => void;
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
    onOpenSettings,
}: ChannelSidebarProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden fixed top-2 right-3 z-50 p-2 bg-[#2b2d31] rounded"
            >
                <Menu size={20} />
            </button>

            {/* Mobile Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
        fixed md:static z-50
        top-0 left-0 h-full
        w-64 bg-[#2b2d31]
        flex flex-col shrink-0
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        `}
            >
                {/* Header */}
                <header className="h-12 px-4 flex items-center justify-between font-bold border-b border-[#1f2023] hover:bg-[#35373c] transition">
                    <span className="truncate font-bold flex"><House size={20} className="inline mr-2 mt-0.5 text-blue-300" /> Room Community</span>

                    <button
                        className="md:hidden"
                        onClick={() => setOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </header>

                {/* Channels */}
                <div className="flex-1 p-2 overflow-y-auto">
                    <div className="px-2 py-2 text-xs font-bold text-gray-400 uppercase">
                        Voice Channels
                    </div>

                    {channels.map((channel) => (
                        <button
                            key={channel.id}
                            onClick={() => {
                                onChannelClick(channel.id);
                                setOpen(false);
                            }}
                            className={`
              w-full flex items-center gap-2 px-2 py-1.5 rounded
              transition-colors cursor-pointer
              ${activeChannel === channel.id
                                    ? "bg-[#3f4147] text-white"
                                    : "text-gray-400 hover:bg-[#35373c] hover:text-gray-200"
                                }
              ${previewChannel === channel.id ? "bg-[#35373c]/60" : ""}
              `}
                        >
                            <Volume2 size={16} className="opacity-70 shrink-0" />
                            <span className="truncate font-medium">{channel.name}</span>
                        </button>
                    ))}
                </div>

                {/* User Controls */}
                <div className="bg-[#232428] p-2 border-t border-[#1f2023]">
                    {/* User Info */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="relative w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm">
                            {username[0]?.toUpperCase()}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#232428] rounded-full" />
                        </div>

                        <div className="flex-1 truncate text-sm font-bold">
                            {username}
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex justify-between cursor-pointer">
                        <ControlButton
                            active={!isMuted}
                            danger={isMuted}
                            onClick={onToggleAudio}
                            title="Mute"
                        >
                            {isMuted ? <MicOff className="cursor-pointer" size={18} /> : <Mic className="cursor-pointer" size={18} />}
                        </ControlButton>

                        <ControlButton
                            active={wantsVideo}
                            danger={!wantsVideo}
                            onClick={onToggleVideo}
                            title="Camera"
                        >
                            {wantsVideo ? <Video className="cursor-pointer" size={18} /> : <VideoOff className="cursor-pointer" size={18} />}
                        </ControlButton>

                        <ControlButton
                            active={isScreenSharing}
                            onClick={onToggleScreenShare}
                            title="Share Screen"
                        >
                            <MonitorUp className="cursor-pointer" size={18} />
                        </ControlButton>

                        {activeChannel && (
                            <ControlButton
                                danger
                                onClick={onLeaveChannel}
                                title="Disconnect"
                            >
                                <PhoneOff className="cursor-pointer" size={18} />
                            </ControlButton>
                        )}

                        <ControlButton
                            onClick={onOpenSettings}
                            title="Settings"
                        >
                            <Settings className="cursor-pointer" size={18} />
                        </ControlButton>
                    </div>
                </div>
            </div>
        </>
    );
}

/* Reusable Control Button */
function ControlButton({
    children,
    onClick,
    active,
    danger,
    title,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
    danger?: boolean;
    title?: string;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`
        p-2 rounded transition
        ${danger ? "text-red-500 hover:bg-red-500/10" : ""}
        ${active
                    ? "text-green-500"
                    : "text-gray-400 hover:text-white hover:bg-[#3f4147]"
                }
      `}
        >
            {children}
        </button>
    );
}
