"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { MessageSquare, X } from "lucide-react";

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
                className="md:hidden fixed bottom-4 right-4 z-40 bg-indigo-600 p-3 rounded-full shadow-lg"
            >
                <MessageSquare size={20} />
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
                <div className="h-12 border-b border-[#26272d] flex items-center justify-between px-4 font-bold shadow-sm">
                    <span>Chat</span>
                    <button className="md:hidden" onClick={() => setOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className="flex flex-col animate-in slide-in-from-bottom-2 duration-200"
                        >
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-sm text-indigo-400">
                                    {msg.senderName}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    className="p-4 bg-[#313338] sticky bottom-0"
                >
                    <input
                        className="w-full bg-[#383a40] text-gray-200 px-4 py-2.5 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            placeholder-gray-500 text-sm"
                        placeholder="Message"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </form>
            </div>
        </>
    );
}
