"use client";

import { useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import ServerSidebar from "@/components/layout/ServerSidebar";
import ChannelSidebar from "@/components/layout/ChannelSidebar";
import VideoGrid from "@/components/video/VideoGrid";
import ChatArea from "@/components/chat/ChatArea";
import AuthProvider, { useAuth } from "@/components/providers/AuthProvider";
import LoginScreen from "@/components/auth/LoginScreen";
import ProfileModal from "@/components/user/ProfileModal";
import { House } from "lucide-react";

// Dummy Data
// const SERVERS = [
//   { id: "s1", name: "Dev Community", color: "bg-indigo-500" },
//   // { id: "s2", name: "Gaming Hub", icon: "🎮", color: "bg-green-500" },
//   // { id: "s3", name: "Music Lounge", icon: "🎵", color: "bg-red-500" },
// ];

const CHANNELS = [
  { id: "c1", name: "General Voice", type: "voice" as const },
  { id: "c2", name: "Gaming", type: "voice" as const },
  { id: "c3", name: "Music", type: "voice" as const },
  { id: "c4", name: "AFK", type: "voice" as const },
];

function AuthenticatedApp() {
  const { user } = useAuth();

  // App State
  // const [activeServer, setActiveServer] = useState(SERVERS[0].id);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [previewChannel, setPreviewChannel] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Video State
  const [wantsVideo, setWantsVideo] = useState(false);

  // Use metadata name or email
  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";

  const {
    localStream,
    remoteStreams,
    toggleAudio,
    toggleVideo,
    isMuted,
    broadcastFile,
    receivedFiles,
    isScreenSharing,
    toggleScreenShare,
    leaveRoom
  } = useWebRTC(activeChannel || "", username, wantsVideo);

  const handleChannelClick = (channelId: string) => {
    if (activeChannel === channelId) return; // already in
    setPreviewChannel(channelId);
    setWantsVideo(false); // Reset to audio only on new join
  };

  const confirmJoin = () => {
    if (previewChannel) {
      setActiveChannel(previewChannel);
      setPreviewChannel(null);
    }
  };

  const leaveChannel = () => {
    leaveRoom();
    setActiveChannel(null);
    setPreviewChannel(null);
    setWantsVideo(false);
    window.location.reload(); // Hard reset for clean slate
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      broadcastFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#313338] text-gray-100 font-sans overflow-hidden">
      {/* Main Discord Layout */}
      <>
        {/* 1. Server Sidebar */}
        {/* <ServerSidebar
          servers={SERVERS}
          activeServer={activeServer}
          onServerClick={setActiveServer}
        /> */}

        {/* 2. Channel Sidebar */}
        <ChannelSidebar
          // server={SERVERS.find((s) => s.id === activeServer)}
          channels={CHANNELS}
          activeChannel={activeChannel}
          previewChannel={previewChannel}
          onChannelClick={handleChannelClick}
          username={username}
          isMuted={isMuted}
          wantsVideo={wantsVideo}
          isScreenSharing={isScreenSharing}
          onToggleAudio={toggleAudio}
          onToggleVideo={() => {
            setWantsVideo(!wantsVideo);
            toggleVideo();
          }}
          onToggleScreenShare={toggleScreenShare}
          onLeaveChannel={leaveChannel}
          onOpenSettings={() => setShowProfile(true)}
        />

        {/* 3. Main Stage */}
        <div className="flex-1 flex min-w-0">
          <div className="flex-1 flex flex-col min-w-0 bg-[#313338] relative">
            {/* Top Bar */}
            <header className="h-12 border-b border-[#26272d] flex items-center px-4 shadow-sm min-h-[48px] shrink-0 justify-between">
              <div className="flex items-center">
                <span className="text-gray-400 text-2xl mr-2">#</span>
                <span className="font-bold">
                  {activeChannel
                    ? CHANNELS.find((c) => c.id === activeChannel)?.name
                    : previewChannel
                      ? CHANNELS.find((c) => c.id === previewChannel)?.name
                      : "Welcome"}
                </span>
                {activeChannel && (
                  <span className="ml-4 bg-green-600 text-white text-xs px-2 py-0.5 rounded font-bold">
                    Connected
                  </span>
                )}
              </div>

              {/* File Upload Button (Only when connected) */}
              {/* {activeChannel && (
                <div>
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-[#3f4147] hover:bg-[#4a4c52] text-gray-200 px-3 py-1 rounded font-medium text-sm flex items-center gap-2 transition-colors"
                  >
                    <span>📂</span> Share File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )} */}
            </header>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-y-auto relative flex flex-col">
              {!activeChannel && !previewChannel ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                  <div className="w-32 h-32 bg-[#2b2d31] rounded-full flex items-center justify-center text-6xl">
                    👋
                  </div>
                  <p className="text-xl font-medium">Select a Voice Channel to join</p>
                </div>
              ) : previewChannel ? (
                /* Preview / Join Confirmation */
                <div className="h-full flex flex-col items-center justify-center gap-6 animate-in zoom-in duration-300">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">Ready to join?</h3>
                    <p className="text-gray-400">
                      You are about to connect to{" "}
                      <span className="font-bold text-indigo-400">
                        {CHANNELS.find((c) => c.id === previewChannel)?.name}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setPreviewChannel(null)}
                      className="px-6 py-3 rounded bg-[#2b2d31] hover:bg-[#35373c] font-medium cursor-pointer border border-[#1f2023]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmJoin}
                      className="px-6 py-3 rounded bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg cursor-pointer"
                    >
                      Join Voice
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Call Grid */
                <div className="w-full h-full flex flex-col gap-4">
                  <VideoGrid
                    localStream={localStream}
                    remoteStreams={remoteStreams}
                    username={username}
                    wantsVideo={wantsVideo}
                    isMuted={isMuted}
                  />

                  {/* File Transfer Feed */}
                  {receivedFiles.length > 0 && (
                    <div className="h-48 bg-[#2b2d31] rounded-lg p-3 overflow-y-auto border border-[#1f2023]">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 sticky top-0 bg-[#2b2d31] pb-2">
                        Shared Files
                      </h4>
                      <div className="space-y-2">
                        {receivedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-[#313338] p-2 rounded hover:bg-[#35373c] transition-colors group"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="bg-indigo-500 p-1.5 rounded text-xs">
                                📄
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate text-sm">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  from User {file.sender.substring(0, 4)}
                                </span>
                              </div>
                            </div>
                            <a
                              href={file.url}
                              download={file.name}
                              className="text-green-500 hover:text-green-400 text-sm font-bold px-3 py-1 rounded bg-green-500/10 hover:bg-green-500/20"
                            >
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Chat Sidebar */}
          {activeChannel && <ChatArea roomId={activeChannel} username={username} />}
        </div>
      </>
      {/* Profile Modal */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}

function AuthWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#313338] text-white">
        <div className="animate-pulse"><House size={16} className="inline mr-2" /> Room Community</div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}
