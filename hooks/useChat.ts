import { useState, useEffect, useCallback } from "react";
import { socket } from "@/lib/socket";

export type ChatMessage = {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
    isSystem?: boolean;
};

export const useChat = (roomId: string, username: string) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (!roomId) return;

        const handleMessage = (msg: ChatMessage) => {
            setMessages((prev) => [...prev, msg]);
        };

        socket.on("chat-message", handleMessage);

        return () => {
            socket.off("chat-message", handleMessage);
        };
    }, [roomId]);

    const sendMessage = useCallback(
        (content: string) => {
            if (!content.trim() || !roomId) return;

            const msg: ChatMessage = {
                id: crypto.randomUUID(),
                senderId: socket.id || "unknown",
                senderName: username,
                content: content,
                timestamp: Date.now(),
            };

            // Optimistic update?
            // For now, let's wait for server echo to avoid duplicates if we broadcast to all
            // Actually server emits to room, which includes sender. So no manual setMessages here.
            socket.emit("chat-message", msg);
        },
        [roomId, username]
    );

    return { messages, sendMessage };
};
