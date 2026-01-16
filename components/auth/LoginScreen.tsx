"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin,
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('https://i.redd.it/vda9rbt01en01.png')] bg-cover bg-center px-4">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-xl shadow-2xl bg-[#313338]/70 backdrop-blur-2xl border border-white/10">
                <h2 className="text-2xl font-bold text-center text-white mb-2">
                    {isSignUp ? "Create an Account" : "Welcome Back!"}
                </h2>
                <p className="text-gray-400 text-center mb-6">
                    {isSignUp ? "Join the community today!" : "We're so excited to see you again!"}
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-2 rounded text-sm mb-4">
                        {error}
                    </div>
                )}

                {/* Google Auth */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full cursor-pointer flex items-center justify-center gap-3 bg-white text-black p-3 rounded font-semibold hover:bg-gray-100 transition"
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        className="w-5 h-5"
                    />
                    Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center my-6">
                    <div className="flex-grow h-px bg-gray-600" />
                    <span className="px-3 text-gray-400 text-sm">OR</span>
                    <div className="flex-grow h-px bg-gray-600" />
                </div>

                {/* Email Auth */}
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                        <input
                            type="email"
                            className="w-full bg-[#1e1f22] p-3 mt-2 rounded text-white focus:outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                        <input
                            type="password"
                            className="w-full bg-[#1e1f22] p-3 mt-2 rounded text-white focus:outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-[#5865F2] hover:bg-[#4752c4] cursor-pointer disabled:opacity-60 text-white p-3 rounded font-bold transition flex justify-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            isSignUp ? "Sign Up" : "Log In"
                        )}
                    </button>
                </form>

                <div className="mt-4 text-sm text-white text-center">
                    {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-indigo-400 hover:underline font-bold cursor-pointer"
                    >
                        {isSignUp ? "Log In" : "Register"}
                    </button>
                </div>
            </div>
        </div>
    );
}
