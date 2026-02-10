"use client";

import { useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import ChannelSidebar from "@/components/layout/ChannelSidebar";
import VideoGrid from "@/components/video/VideoGrid";
import ChatArea from "@/components/chat/ChatArea";
import AuthProvider, { useAuth } from "@/components/providers/AuthProvider";
import LoginScreen from "@/components/auth/LoginScreen";
import ProfileModal from "@/components/user/ProfileModal";
import {
  House,
  Hash,
  Download,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  SwitchCamera,
  X,
} from "lucide-react";

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

  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [previewChannel, setPreviewChannel] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [wantsVideo, setWantsVideo] = useState(false);
  const [showFileTransfer, setShowFileTransfer] = useState(true);

  const username =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

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
    leaveRoom,
    switchCamera,
    currentFacingMode,
  } = useWebRTC(activeChannel || "", username, wantsVideo);

  const handleChannelClick = (id: string) => {
    if (activeChannel === id) return;
    setPreviewChannel(id);
    setWantsVideo(false);
  };

  const confirmJoin = () => {
    if (!previewChannel) return;
    setActiveChannel(previewChannel);
    setPreviewChannel(null);
  };

  const leaveChannel = () => {
    leaveRoom();
    setActiveChannel(null);
    setPreviewChannel(null);
    setWantsVideo(false);
    window.location.reload();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      broadcastFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#1e1f22] text-[#f2f3f5] overflow-hidden">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex flex-1 min-w-0">
        <div className="flex flex-col flex-1 bg-[#313338] min-w-0">
          {/* Top Bar */}
          <header className="h-14 border-b border-[#1f2023] flex items-center justify-between px-4 bg-[#2b2d31]">
            <div className="flex items-center gap-2">
              <Hash size={20} className="text-[#80848e]" />
              <span className="font-semibold">
                {activeChannel
                  ? CHANNELS.find(c => c.id === activeChannel)?.name
                  : previewChannel
                    ? CHANNELS.find(c => c.id === previewChannel)?.name
                    : `Welcome, ${username}`}
              </span>
            </div>

            {activeChannel && (
              <label className="cursor-pointer flex items-center gap-2 text-sm bg-[#404249] hover:bg-[#4e5058] px-3 py-1.5 rounded">
                <Download size={16} />
                Share File
                <input
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </header>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
            {!activeChannel && !previewChannel && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <House size={64} className="text-[#5865f2]" />
                <h2 className="text-2xl font-bold">Welcome to Mitro</h2>
                <p className="text-[#b5bac1]">
                  Select a channel to get started
                </p>
              </div>
            )}

            {previewChannel && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <h2 className="text-3xl font-bold">Ready to join?</h2>
                <p className="text-[#b5bac1]">
                  Join{" "}
                  <span className="text-[#5865f2] font-bold">
                    {CHANNELS.find(c => c.id === previewChannel)?.name}
                  </span>
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => setPreviewChannel(null)}
                    className="px-6 py-3 bg-[#4e5058] rounded hover:bg-[#5c5e66]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmJoin}
                    className="px-6 py-3 bg-[#23a559] rounded font-bold hover:bg-[#1f8f4c]"
                  >
                    Join Channel
                  </button>
                </div>
              </div>
            )}

            {activeChannel && (
              <>
                <VideoGrid
                  localStream={localStream}
                  remoteStreams={remoteStreams}
                  username={username}
                  wantsVideo={wantsVideo}
                  isMuted={isMuted}
                />

                {/* Controls */}
                <div className="flex flex-wrap justify-center gap-2 mb-20 sm:gap-3 md:mb-0 bg-[#2b2d31] p-2 sm:p-3 rounded-lg">
                  <button
                    onClick={toggleAudio}
                    className={`p-2.5 sm:p-3 rounded-full transition-all ${isMuted
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-[#404249] hover:bg-[#4e5058]"
                      }`}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>

                  {CHANNELS.find(c => c.id === activeChannel)?.type !== "voice" && (
                    <>
                      <button
                        onClick={() => {
                          setWantsVideo(!wantsVideo);
                          toggleVideo();
                        }}
                        className={`p-2.5 sm:p-3 rounded-full transition-all ${wantsVideo
                            ? "bg-[#404249] hover:bg-[#4e5058]"
                            : "bg-red-500 hover:bg-red-600"
                          }`}
                        aria-label={wantsVideo ? "Turn off video" : "Turn on video"}
                      >
                        {wantsVideo ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
                      </button>

                      {wantsVideo && (
                        <button
                          onClick={switchCamera}
                          className="p-2.5 sm:p-3 rounded-full bg-[#404249] hover:bg-[#4e5058] transition-all"
                          aria-label="Switch camera"
                        >
                          <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      )}
                    </>
                  )}

                  {CHANNELS.find(c => c.id === activeChannel)?.type === "meeting" && (
                    <button
                      onClick={toggleScreenShare}
                      className={`p-2.5 sm:p-3 rounded-full transition-all ${isScreenSharing
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-[#404249] hover:bg-[#4e5058]"
                        }`}
                      aria-label={isScreenSharing ? "Stop sharing" : "Share screen"}
                    >
                      <MonitorUp className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  )}

                  <button
                    onClick={leaveChannel}
                    className="p-2.5 sm:p-3 rounded-full bg-red-500 hover:bg-red-600 transition-all"
                    aria-label="Leave channel"
                  >
                    <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* File Transfer */}
                {receivedFiles.length > 0 && showFileTransfer && (
                  <div className="bg-[#2b2d31] rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold">
                        Shared Files
                      </span>
                      <button onClick={() => setShowFileTransfer(false)}>
                        <X size={16} />
                      </button>
                    </div>

                    {receivedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-[#313338] p-2 rounded mb-2"
                      >
                        <span className="truncate">{file.name}</span>
                        <a
                          href={file.url}
                          download
                          className="text-green-500 font-bold"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {activeChannel && (
          <ChatArea roomId={activeChannel} username={username} />
        )}
      </div>

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}

function AuthWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1f22]">
        <span className="animate-pulse text-lg font-bold">
          Mitro Community
        </span>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <AuthenticatedApp />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}
