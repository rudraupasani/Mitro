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
import { House, Hash, Download } from "lucide-react";

const CHANNELS = [
  { id: "c1", name: "General Voice", type: "voice" as const },
  { id: "c2", name: "Gaming Room", type: "voice" as const },
  { id: "v1", name: "General Video", type: "video" as const },
  { id: "v2", name: "Stream Lounge", type: "video" as const },
  { id: "m1", name: "Daily Standup", type: "meeting" as const },
  { id: "m2", name: "Project Sync", type: "meeting" as const },
];

function AuthenticatedApp() {
  const { user } = useAuth();

  // App State
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
    <div className="flex h-screen w-full bg-[#313338] text-[#f2f3f5] font-sans overflow-hidden">
      {/* Main Discord Layout */}
      <>
        {/* Channel Sidebar */}
        <ChannelSidebar
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
            <header className="h-12 border-b border-[#26272d] flex items-center px-4 shadow-sm min-h-[48px] shrink-0 justify-between bg-[#313338]">
              <div className="flex items-center gap-2">
                <Hash className="text-[#80848e]" size={24} />
                <span className="font-semibold text-[#f2f3f5]">
                  {activeChannel
                    ? CHANNELS.find((c) => c.id === activeChannel)?.name
                    : previewChannel
                      ? CHANNELS.find((c) => c.id === previewChannel)?.name
                      : `Welcome, ${username}`}
                </span>
                {activeChannel && (
                  <span className="ml-2 w-2 h-2 bg-[#23a559] rounded-full animate-pulse"></span>
                )}
              </div>

              {/* File Upload Button (Only when connected) */}
              {activeChannel && (
                <div>
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-[#4e5058] hover:bg-[#5c5e66] text-[#f2f3f5] px-3 py-1.5 rounded font-medium text-sm flex items-center gap-2 transition-colors"
                  >
                    <Download size={16} />
                    Share File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </header>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-y-auto relative flex flex-col">
              {!activeChannel && !previewChannel ? (
                <div className="h-full flex flex-col items-center justify-center text-[#b5bac1] gap-6">
                  <div className="w-32 h-32 bg-[#2b2d31] rounded-full flex items-center justify-center text-6xl shadow-lg">
                    <House size={64} className="text-[#5865f2]" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#f2f3f5] mb-2">Welcome to Mitro</p>
                    <p className="text-base text-[#b5bac1]">Select a channel to get started</p>
                  </div>
                </div>
              ) : previewChannel ? (
                /* Preview / Join Confirmation */
                <div className="h-full flex flex-col items-center justify-center gap-6 animate-fade-in">
                  <div className="text-center space-y-3 max-w-md">
                    <h3 className="text-3xl font-bold text-[#f2f3f5]">Ready to join?</h3>
                    <p className="text-[#b5bac1] text-lg">
                      You are about to connect to{" "}
                      <span className="font-bold text-[#5865f2]">
                        {CHANNELS.find((c) => c.id === previewChannel)?.name}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setPreviewChannel(null)}
                      className="px-6 py-3 rounded-md bg-[#4e5058] hover:bg-[#5c5e66] text-[#f2f3f5] font-medium cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmJoin}
                      className="px-6 py-3 rounded-md bg-[#23a559] hover:bg-[#1f8f4c] text-white font-bold shadow-lg cursor-pointer transition-colors"
                    >
                      Join Channel
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
                      <h4 className="text-xs font-bold text-[#b5bac1] uppercase mb-2 sticky top-0 bg-[#2b2d31] pb-2">
                        Shared Files
                      </h4>
                      <div className="space-y-2">
                        {receivedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-[#313338] p-2 rounded hover:bg-[#35373c] transition-colors group"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="bg-[#5865f2] p-1.5 rounded text-xs">
                                <Download size={16} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate text-sm text-[#f2f3f5]">
                                  {file.name}
                                </span>
                                <span className="text-xs text-[#b5bac1]">
                                  from {file.sender.substring(0, 8)}
                                </span>
                              </div>
                            </div>
                            <a
                              href={file.url}
                              download={file.name}
                              className="text-[#23a559] hover:text-[#1f8f4c] text-sm font-bold px-3 py-1 rounded bg-[#23a559]/10 hover:bg-[#23a559]/20 transition-colors"
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
      <div className="h-screen w-full flex items-center justify-center bg-[#313338] text-[#f2f3f5]">
        <div className="flex items-center gap-3 animate-pulse">
          <House size={24} className="text-[#5865f2]" />
          <span className="text-lg font-semibold">Mitro Community</span>
        </div>
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
