"use client";

import { Server } from "@/types";

interface ServerSidebarProps {
    servers: Server[];
    activeServer: string;
    onServerClick: (id: string) => void;
}

export default function ServerSidebar({ servers, activeServer, onServerClick }: ServerSidebarProps) {
    return (
        <nav className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 overflow-y-auto hide-scrollbar z-20">
            {servers.map((server) => (
                <div key={server.id} className="relative group flex items-center justify-center w-full">
                    {/* Indicator */}
                    <div
                        className={`absolute left-0 bg-white rounded-r-full transition-all duration-200 
                  ${activeServer === server.id ? "h-10 w-1" : "h-2 w-1 scale-0 group-hover:scale-100"}`}
                    />

                    <button
                        onClick={() => onServerClick(server.id)}
                        className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center text-2xl overflow-hidden
                  ${activeServer === server.id ? server.color : "bg-[#313338] group-hover:" + server.color}`}
                    >
                        {server.icon}
                    </button>
                </div>
            ))}
        </nav>
    );
}
