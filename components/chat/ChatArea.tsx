"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { Hash, Send, X } from "lucide-react";

interface ChatAreaProps {
    roomId: string;
    username: string;
}

export default function ChatArea({ roomId, username }: ChatAreaProps) {
    const { messages, sendMessage } = useChat(roomId, username);
    const [input, setInput] = useState("");
    const [open, setOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput("");
    };

    return (
        <>
            {/* Mobile Chat Toggle Button */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden fixed bottom-20 right-4 z-40 bg-[#5865f2] hover:bg-[#4752c4] p-4 rounded-full shadow-lg transition-colors"
                aria-label="Open chat"
            >
                <Hash size={24} className="text-white" />
            </button>

            {/* Mobile Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Chat Container */}
            <div
                className={`
        fixed md:static z-40
        bottom-0 right-0 h-[75vh] md:h-full
        w-full md:w-80
        bg-[#313338] border-l border-[#26272d]
        flex flex-col
        transform transition-transform duration-300
        ${open ? "translate-y-0" : "translate-y-full"}
        md:translate-y-0
        `}
            >
                {/* Header */}
                <div className="h-12 border-b border-[#26272d] flex items-center justify-between px-4 font-semibold shadow-sm bg-[#313338]">
                    <span className="flex items-center gap-2 text-[#f2f3f5]">
                        <Hash size={20} className="text-[#80848e]" />
                        Room Chat
                    </span>
                    <button
                        className="md:hidden hover:bg-[#3f4147] p-1 rounded transition-colors"
                        onClick={() => setOpen(false)}
                        aria-label="Close chat"
                    >
                        <X size={18} className="text-[#b5bac1]" />
                    </button>
                </div>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-[#80848e]">
                            <Hash size={48} className="mb-2 opacity-50" />
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs mt-1">Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className="flex flex-col animate-slide-in hover:bg-[#2b2d31] -mx-2 px-2 py-1 rounded transition-colors"
                            >
                                <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-sm text-[#5865f2] hover:underline cursor-pointer">
                                        {msg.senderName}
                                    </span>
                                    <span className="text-[10px] text-[#80848e]">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                                <p className="text-[#f2f3f5] text-sm whitespace-pre-wrap break-words mt-0.5">
                                    {msg.content}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    className="p-4 bg-[#313338] border-t border-[#26272d]"
                >
                    <div className="relative">
                        <input
                            className="w-full bg-[#383a40] text-[#f2f3f5] px-4 py-2.5 pr-12 rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-[#5865f2]
                                placeholder-[#80848e] text-sm transition-all"
                            placeholder={`Message #room-chat`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 
                                bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#4e5058] 
                                p-2 rounded-md transition-colors disabled:cursor-not-allowed"
                            aria-label="Send message"
                        >
                            <Send size={16} className="text-white" />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
