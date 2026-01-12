"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage, useChat } from "@/hooks/useChat";

interface ChatAreaProps {
    roomId: string;
    username: string;
}

export default function ChatArea({ roomId, username }: ChatAreaProps) {
    const { messages, sendMessage } = useChat(roomId, username);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input);
            setInput("");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#313338] border-l border-[#26272d] w-80 shrink-0">
            <div className="h-12 border-b border-[#26272d] flex items-center px-4 font-bold shadow-sm">
                Stream Chat
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-sm text-indigo-400">{msg.senderName}</span>
                            <span className="text-[10px] text-gray-500">
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-[#313338]">
                <input
                    className="w-full bg-[#383a40] text-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 text-sm"
                    placeholder={`Message #${roomId}`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
            </form>
        </div>
    );
}
