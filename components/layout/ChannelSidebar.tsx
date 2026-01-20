"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "../providers/AuthProvider";

interface ChannelSidebarProps {
    server?: Server;
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
    const { user } = useAuth()
    const [userName, setUserName] = useState(user?.user_metadata?.full_name)


    useEffect(() => {
        if (user?.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name);
        } else if (user?.email) {
            setUserName(user.email);
        }
    }, [user]);

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
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        shadow-xl md:shadow-none
        `}
            >
                {/* Header */}
                <header className="h-12 px-4 flex items-center justify-between font-semibold border-b border-[#1f2023] hover:bg-[#35373c] transition-colors cursor-pointer">
                    <span className="truncate flex items-center gap-2 text-[#f2f3f5]">
                        <House size={20} className="text-[#5865f2]" />
                        Mitro Community
                    </span>

                    <button
                        className="md:hidden"
                        onClick={() => setOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </header>

                {/* Channels */}
                <div className="flex-1 p-2 overflow-y-auto space-y-1">
                    {/* Voice Channels */}
                    {channels.filter(c => c.type === "voice").length > 0 && (
                        <div className="mb-4">
                            <div className="px-2 py-1.5 text-xs font-semibold text-[#80848e] uppercase tracking-wide">
                                Voice Channels
                            </div>
                            <div className="space-y-0.5">
                                {channels.filter(c => c.type === "voice").map((channel) => (
                                    <button
                                        key={channel.id}
                                        onClick={() => {
                                            onChannelClick(channel.id);
                                            setOpen(false);
                                        }}
                                        className={`
                                        w-full flex items-center gap-2 px-2 py-1.5 rounded
                                        transition-all duration-150 cursor-pointer group
                                        ${activeChannel === channel.id
                                                ? "bg-[#3f4147] text-[#f2f3f5]"
                                                : "text-[#b5bac1] hover:bg-[#35373c] hover:text-[#f2f3f5]"
                                            }
                                        ${previewChannel === channel.id ? "bg-[#35373c]/60" : ""}
                                        `}
                                    >
                                        <Volume2 size={18} className={`shrink-0 ${activeChannel === channel.id ? 'text-[#f2f3f5]' : 'text-[#80848e] group-hover:text-[#b5bac1]'}`} />
                                        <span className="truncate font-medium text-sm">{channel.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Video Channels */}
                    {channels.filter(c => c.type === "video").length > 0 && (
                        <div className="mb-4">
                            <div className="px-2 py-1.5 text-xs font-semibold text-[#80848e] uppercase tracking-wide">
                                Video Channels
                            </div>
                            <div className="space-y-0.5">
                                {channels.filter(c => c.type === "video").map((channel) => (
                                    <button
                                        key={channel.id}
                                        onClick={() => {
                                            onChannelClick(channel.id);
                                            setOpen(false);
                                        }}
                                        className={`
                                        w-full flex items-center gap-2 px-2 py-1.5 rounded
                                        transition-all duration-150 cursor-pointer group
                                        ${activeChannel === channel.id
                                                ? "bg-[#3f4147] text-[#f2f3f5]"
                                                : "text-[#b5bac1] hover:bg-[#35373c] hover:text-[#f2f3f5]"
                                            }
                                        ${previewChannel === channel.id ? "bg-[#35373c]/60" : ""}
                                        `}
                                    >
                                        <Video size={18} className={`shrink-0 ${activeChannel === channel.id ? 'text-[#f2f3f5]' : 'text-[#80848e] group-hover:text-[#b5bac1]'}`} />
                                        <span className="truncate font-medium text-sm">{channel.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Meeting Channels */}
                    {channels.filter(c => c.type === "meeting").length > 0 && (
                        <div className="mb-4">
                            <div className="px-2 py-1.5 text-xs font-semibold text-[#80848e] uppercase tracking-wide">
                                Meeting Channels
                            </div>
                            <div className="space-y-0.5">
                                {channels.filter(c => c.type === "meeting").map((channel) => (
                                    <button
                                        key={channel.id}
                                        onClick={() => {
                                            onChannelClick(channel.id);
                                            setOpen(false);
                                        }}
                                        className={`
                                        w-full flex items-center gap-2 px-2 py-1.5 rounded
                                        transition-all duration-150 cursor-pointer group
                                        ${activeChannel === channel.id
                                                ? "bg-[#3f4147] text-[#f2f3f5]"
                                                : "text-[#b5bac1] hover:bg-[#35373c] hover:text-[#f2f3f5]"
                                            }
                                        ${previewChannel === channel.id ? "bg-[#35373c]/60" : ""}
                                        `}
                                    >
                                        <MonitorUp size={18} className={`shrink-0 ${activeChannel === channel.id ? 'text-[#f2f3f5]' : 'text-[#80848e] group-hover:text-[#b5bac1]'}`} />
                                        <span className="truncate font-medium text-sm">{channel.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Buttons */}
                <div className="flex justify-between items-center p-2 border-t border-[#1f2023] bg-[#232428]">
                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#5865f2] to-[#3c45a5] flex items-center justify-center font-bold text-sm overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="text-lg font-bold text-white">{userName?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#23a559] border-2 border-[#232428] rounded-full" />
                    </div>
                    <ControlButton
                        active={!isMuted}
                        danger={isMuted}
                        onClick={onToggleAudio}
                        title="Mute"
                    >
                        {isMuted ? <MicOff className="cursor-pointer" size={18} /> : <Mic className="cursor-pointer" size={18} />}
                    </ControlButton>

                    {/* Video Toggle - Hidden for Voice Channels */}
                    {(!activeChannel || channels.find(c => c.id === activeChannel)?.type !== "voice") && (
                        <ControlButton
                            active={wantsVideo}
                            danger={!wantsVideo}
                            onClick={onToggleVideo}
                            title="Camera"
                        >
                            {wantsVideo ? <Video className="cursor-pointer" size={18} /> : <VideoOff className="cursor-pointer" size={18} />}
                        </ControlButton>
                    )}

                    {/* Screen Share - Only for Meeting Channels */}
                    {activeChannel && channels.find(c => c.id === activeChannel)?.type === "meeting" && (
                        <ControlButton
                            active={isScreenSharing}
                            onClick={onToggleScreenShare}
                            title="Share Screen"
                        >
                            <MonitorUp className="cursor-pointer" size={18} />
                        </ControlButton>
                    )}

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
        p-2 rounded transition-all duration-150
        ${danger ? "text-[#f23f43] hover:bg-[#f23f43]/10" : ""}
        ${active
                    ? "text-[#23a559] bg-[#23a559]/10"
                    : "text-[#b5bac1] hover:text-[#f2f3f5] hover:bg-[#3f4147]"
                }
      `}
        >
            {children}
        </button>
    );
}
