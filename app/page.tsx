"use client";

import { useState, useRef, useEffect } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";

// Dummy Data
const SERVERS = [
  { id: "s1", name: "Dev Community", icon: "👨‍💻", color: "bg-indigo-500" },
  { id: "s2", name: "Gaming Hub", icon: "🎮", color: "bg-green-500" },
  { id: "s3", name: "Music Lounge", icon: "🎵", color: "bg-red-500" },
];

const CHANNELS = [
  { id: "c1", name: "General Voice", type: "voice" },
  { id: "c2", name: "Gaming", type: "voice" },
  { id: "c3", name: "Music", type: "voice" },
  { id: "c4", name: "AFK", type: "voice" },
];

export default function Home() {
  // Auth State
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // App State
  const [activeServer, setActiveServer] = useState(SERVERS[0].id);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [previewChannel, setPreviewChannel] = useState<string | null>(null);

  // Video State
  const [wantsVideo, setWantsVideo] = useState(false);

  const {
    localStream,
    remoteStreams,
    toggleAudio,
    isMuted,
    broadcastFile,
    receivedFiles
  } = useWebRTC(activeChannel || "", username, wantsVideo);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) setIsLoggedIn(true);
  };

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
  }

  const leaveChannel = () => {
    setActiveChannel(null);
    setPreviewChannel(null);
    setWantsVideo(false);
    window.location.reload();
  }

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      broadcastFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#313338] text-gray-100 font-sans overflow-hidden">
      {!isLoggedIn ? (
        /* Login Screen */
        <div className="flex w-full h-full items-center justify-center bg-[url('https://cdn.wallpapersafari.com/13/23/p3M7Cq.jpg')] bg-cover bg-center">
          <div className="bg-[#313338] p-8 rounded-md shadow-2xl w-full max-w-sm animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-center mb-2">Welcome Back!</h2>
            <p className="text-gray-400 text-center mb-6">We're so excited to see you again!</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Username</label>
                <input
                  className="w-full bg-[#1e1f22] border-none p-3 mt-2 rounded focus:outline-none text-white"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoFocus
                />
              </div>
              <button className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white p-3 rounded font-bold transition-colors">
                Log In
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Main Discord Layout */
        <>
          {/* 1. Server Sidebar */}
          <nav className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 overflow-y-auto hide-scrollbar z-20">
            {SERVERS.map(server => (
              <div key={server.id} className="relative group flex items-center justify-center w-full">
                {/* Indicator */}
                <div className={`absolute left-0 bg-white rounded-r-full transition-all duration-200 
                                    ${activeServer === server.id ? 'h-10 w-1' : 'h-2 w-1 scale-0 group-hover:scale-100'}`}
                />

                <button
                  onClick={() => setActiveServer(server.id)}
                  className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center text-2xl overflow-hidden
                                    ${activeServer === server.id ? server.color : 'bg-[#313338] group-hover:' + server.color}`}
                >
                  {server.icon}
                </button>
              </div>
            ))}
          </nav>

          {/* 2. Channel Sidebar */}
          <div className="w-60 bg-[#2b2d31] flex flex-col z-10 shrink-0">
            {/* Header */}
            <header className="h-12 border-b border-[#1f2023] flex items-center px-4 font-bold shadow-sm cursor-pointer hover:bg-[#35373c] transition-colors">
              {SERVERS.find(s => s.id === activeServer)?.name}
            </header>

            {/* Channels */}
            <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
              <div className="flex items-center justify-between px-2 text-xs font-bold text-gray-400 uppercase hover:text-gray-300 cursor-pointer pt-4 pb-2">
                <span>Voice Channels</span>
              </div>
              {CHANNELS.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.id)}
                  className={`w-full flex items-center px-2 py-1.5 rounded group transition-all text-gray-400 hover:text-gray-200 hover:bg-[#35373c]
                                    ${activeChannel === channel.id ? 'bg-[#3f4147] text-white' : ''}
                                    ${previewChannel === channel.id ? 'bg-[#35373c]/50' : ''}`}
                >
                  <span className="text-xl mr-2 text-gray-500 group-hover:text-gray-300">🔊</span>
                  <span className={`truncate ${activeChannel === channel.id ? 'font-medium' : ''}`}>{channel.name}</span>
                </button>
              ))}
            </div>

            {/* User Controls */}
            <div className="h-[52px] bg-[#232428] px-2 flex items-center gap-2 mt-auto">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm relative shrink-0">
                {username[0]?.toUpperCase()}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#232428] rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{username}</div>
                <div className="text-xs text-gray-400 truncate">Online</div>
              </div>
              <button onClick={toggleAudio} className={`p-1.5 rounded hover:bg-[#3f4147] ${isMuted ? 'text-red-500 relative' : ''}`}>
                🎤
                {isMuted && <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold transform rotate-45 text-lg pointer-events-none">\</div>}
              </button>
              <button
                onClick={() => setWantsVideo(!wantsVideo)}
                className={`p-1.5 rounded hover:bg-[#3f4147] ${!wantsVideo ? 'text-red-500 relative' : 'text-green-500'}`}
              >
                📷
                {!wantsVideo && <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold transform rotate-45 text-lg pointer-events-none">\</div>}
              </button>
              {activeChannel && (
                <button onClick={leaveChannel} className="p-1.5 rounded hover:bg-[#3f4147] text-red-500" title="Disconnect">
                  📞
                </button>
              )}
            </div>
          </div>

          {/* 3. Main Stage */}
          <div className="flex-1 bg-[#313338] flex flex-col min-w-0 relative">
            {/* Top Bar */}
            <header className="h-12 border-b border-[#26272d] flex items-center px-4 shadow-sm min-h-[48px] shrink-0 justify-between">
              <div className="flex items-center">
                <span className="text-gray-400 text-2xl mr-2">#</span>
                <span className="font-bold">
                  {activeChannel
                    ? CHANNELS.find(c => c.id === activeChannel)?.name
                    : previewChannel
                      ? CHANNELS.find(c => c.id === previewChannel)?.name
                      : "Welcome"}
                </span>
                {activeChannel && <span className="ml-4 bg-green-600 text-white text-xs px-2 py-0.5 rounded font-bold">Connected</span>}
              </div>

              {/* File Upload Button (Only when connected) */}
              {activeChannel && (
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer bg-[#3f4147] hover:bg-[#4a4c52] text-gray-200 px-3 py-1 rounded font-medium text-sm flex items-center gap-2 transition-colors">
                    <span>📂</span> Share File
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
            <div className="flex-1 p-4 overflow-y-auto relative">
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
                    <p className="text-gray-400">You are about to connect to <span className="font-bold text-indigo-400">{CHANNELS.find(c => c.id === previewChannel)?.name}</span></p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setPreviewChannel(null)}
                      className="px-6 py-3 rounded bg-[#2b2d31] hover:bg-[#35373c] font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmJoin}
                      className="px-6 py-3 rounded bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg"
                    >
                      Join Voice
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Call Grid */
                <div className="w-full h-full flex flex-col gap-4">
                  {/* Video Grid */}
                  <div className="flex-1 flex items-center justify-center min-h-0">
                    <div className="w-full max-w-6xl grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] auto-rows-[400px]">

                      {/* Local User */}
                      <div className="bg-black rounded-xl overflow-hidden relative shadow-lg border border-gray-800 flex flex-col items-center justify-center group h-full">
                        {wantsVideo ?
                          <VideoPlayer stream={localStream} muted={true} isVideoOff={false} />
                          :
                          <>
                            <div className={`w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-3xl mb-2 relative ${!isMuted ? 'ring-4 ring-green-500' : ''}`}>
                              {username[0]?.toUpperCase()}
                              {isMuted && <div className="absolute bottom-0 right-0 bg-red-600 rounded-full p-1 border-4 border-black text-xs">🔇</div>}
                            </div>
                            <div className="font-bold text-lg">{username} (You)</div>
                            <div className="text-xs text-green-400 font-mono mt-1">Connected</div>
                          </>
                        }
                      </div>

                      {/* Remote Users */}
                      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => {
                        const hasVideo = stream.getVideoTracks().length > 0;
                        return (
                          <div key={peerId} className="bg-black rounded-xl overflow-hidden relative shadow-lg border border-gray-800 flex flex-col items-center justify-center h-full">
                            {hasVideo ? (
                              <VideoPlayer stream={stream} muted={false} isVideoOff={false} />
                            ) : (
                              <>
                                <VideoPlayer stream={stream} muted={false} isVideoOff={true} />
                                <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-3xl mb-2 relative ring-4 ring-green-500/50 animate-pulse">
                                  U
                                </div>
                                <div className="font-bold text-lg">User {peerId.substring(0, 4)}</div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* File Transfer Feed */}
                  {receivedFiles.length > 0 && (
                    <div className="h-48 bg-[#2b2d31] rounded-lg p-3 overflow-y-auto border border-[#1f2023]">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 sticky top-0 bg-[#2b2d31] pb-2">Shared Files</h4>
                      <div className="space-y-2">
                        {receivedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-[#313338] p-2 rounded hover:bg-[#35373c] transition-colors group">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="bg-indigo-500 p-1.5 rounded text-xs">📄</div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate text-sm">{file.name}</span>
                                <span className="text-xs text-gray-400">from User {file.sender.substring(0, 4)}</span>
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
        </>
      )}
    </div>
  );
}

// Helper Component (Updated for conditional rendering)
function VideoPlayer({ stream, muted, isVideoOff }: { stream: MediaStream | null, muted?: boolean, isVideoOff?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (isVideoOff) return <video ref={videoRef} autoPlay playsInline muted={muted} className="hidden" />;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className="w-full h-full object-cover bg-[#202225]" // Show video if on
    />
  );
}
