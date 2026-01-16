"use client";

import { useState } from "react";
import { Server } from "@/types";
import { Menu, X } from "lucide-react";

interface ServerSidebarProps {
    servers: Server[];
    activeServer: string;
    onServerClick: (id: string) => void;
}

export default function ServerSidebar({
    servers,
    activeServer,
    onServerClick,
}: ServerSidebarProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden fixed top-3 left-3 z-50 p-2 rounded bg-[#1e1f22]"
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
            <nav
                className={`
        fixed md:static z-50
        top-0 left-0 h-full
        w-[72px] bg-[#1e1f22]
        flex flex-col items-center py-3 gap-2
        overflow-y-auto hide-scrollbar
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        `}
            >
                {/* Close Button (mobile) */}
                <button
                    className="md:hidden mb-2"
                    onClick={() => setOpen(false)}
                >
                    <X size={18} />
                </button>

                {servers.map((server) => (
                    <div
                        key={server.id}
                        className="relative group flex items-center justify-center w-full"
                    >
                        {/* Active Indicator */}
                        <div
                            className={`
              absolute left-0 bg-white rounded-r-full transition-all duration-200
              ${activeServer === server.id
                                    ? "h-10 w-1"
                                    : "h-2 w-1 scale-0 group-hover:scale-100"
                                }
              `}
                        />

                        {/* Server Button */}
                        <button
                            onClick={() => {
                                onServerClick(server.id);
                                setOpen(false);
                            }}
                            className={`
              w-12 h-12 rounded-[24px]
              group-hover:rounded-[16px]
              transition-all duration-200
              flex items-center justify-center
              text-2xl overflow-hidden
              ${activeServer === server.id
                                    ? server.color
                                    : "bg-[#313338] group-hover:" + server.color
                                }
              `}
                        >
                            {server.icon}
                        </button>
                    </div>
                ))}
            </nav>
        </>
    );
}
