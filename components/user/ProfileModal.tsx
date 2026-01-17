"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

interface ProfileModalProps {
    onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
    const { user, signOut } = useAuth();
    const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || "");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        if (user?.user_metadata?.full_name) {
            setDisplayName(user.user_metadata.full_name);
        } else if (user?.email) {
            setDisplayName(user.email.split("@")[0]);
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        setMsg("");
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: displayName },
            });
            if (error) throw error;
            setMsg("Profile updated!");
        } catch (e: any) {
            setMsg("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-200">
            <div className="bg-[#313338] w-full max-w-md rounded-lg shadow-2xl overflow-hidden border border-[#26272d] animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Settings</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
                    </div>

                    {/* Profile Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white relative">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full rounded-full" />
                            ) : (
                                <span className="text-3xl font-bold text-white">{user?.user_metadata?.full_name?.[0]}</span>
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-xl">{displayName}</div>
                            <div className="text-sm text-gray-400">{user?.email}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Display Name</label>
                            <input
                                className="w-full bg-[#1e1f22] border-none p-2.5 mt-1.5 rounded focus:outline-none text-white font-medium"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>

                        {msg && (
                            <div className={`text-sm p-2 rounded ${msg.includes("Error") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                                {msg}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#2b2d31] p-4 flex justify-between items-center">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 rounded-sm hover:bg-red-700 text-white font-medium text-sm  cursor-pointer"
                    >
                        Log Out
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 bg-black/40 rounded-sm  text-sm font-medium cursor-pointer">Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white cursor-pointer rounded text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
