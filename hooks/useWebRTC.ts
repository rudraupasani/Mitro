import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "@/lib/socket";

type Peer = {
    peerId: string;
    createOffer: boolean;
};

type FileTransferState = {
    fileName: string;
    fileSize: number;
    receivedSize: number;
    chunks: ArrayBuffer[];
    isReceiving: boolean;
    senderId: string;
};

export const useWebRTC = (roomId: string, username: string, videoEnabled: boolean = true) => {
    const [peers, setPeers] = useState<string[]>([]);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    // remoteStreams map: peerId -> MediaStream
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

    // File Transfer State
    const [receivedFiles, setReceivedFiles] = useState<Array<{ name: string, url: string, sender: string }>>([]);
    const fileTransferRefs = useRef<Map<string, FileTransferState>>(new Map()); // Key: senderId

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(!videoEnabled);

    // Helper to renegotiate all peers
    const renegotiateAll = useCallback(() => {
        peersRef.current.forEach((pc, userId) => {
            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                socket.emit("offer", { target: userId, sdp: offer });
            }).catch(console.error);
        });
    }, []);

    // Initialize/Update Local Media
    useEffect(() => {
        if (!roomId) return;

        const constraints = {
            audio: true,
            video: videoEnabled
        };

        console.log(`🎥 Media Constraints changed: Audio=true, Video=${videoEnabled}`);

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                // 1. Update State
                setLocalStream(stream);

                // 2. Stop old tracks ONLY if we are replacing them completely?
                // Actually best to stop strictly old tracks that are NOT in new stream.
                // But here we get a fresh stream every time.
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(t => t.stop());
                }
                localStreamRef.current = stream;

                // 3. Update Peers
                peersRef.current.forEach((pc, userId) => {
                    // For each track in new stream, find sender or add track
                    const senders = pc.getSenders();

                    stream.getTracks().forEach(newTrack => {
                        const existingSender = senders.find(s => s.track?.kind === newTrack.kind);
                        if (existingSender) {
                            console.log(`🔄 Replacing ${newTrack.kind} track for ${userId}`);
                            existingSender.replaceTrack(newTrack);
                        } else {
                            console.log(`➕ Adding new ${newTrack.kind} track for ${userId}`);
                            pc.addTrack(newTrack, stream);
                            // If we added a track, we MUST renegotiate for this peer
                            // But we do it after the loop potentially?
                            // pc.addTrack triggers 'negotiationneeded' but we handle manual offers.
                        }
                    });

                    // Check for tracks to remove (e.g. if videoEnabled went true -> false)
                    senders.forEach(sender => {
                        if (sender.track && !stream.getTracks().find(t => t.kind === sender.track!.kind)) {
                            console.log(`➖ Removing/Stopping ${sender.track.kind} track for ${userId}`);
                            pc.removeTrack(sender);
                        }
                    });

                    // Always triggered re-negotiation to ensure remote knows about track changes
                    pc.createOffer().then(offer => {
                        pc.setLocalDescription(offer);
                        socket.emit("offer", { target: userId, sdp: offer });
                    });
                });

            })
            .catch(err => {
                console.error("Failed to get local stream", err);
                // Fallback?
            });

        // Cleanup on unmount or roomId change
        return () => {
            // We don't stop tracks here because we might just be toggling video
            // The next effect run handles cleanup of 'old' ref.
        };
    }, [roomId, videoEnabled]);

    // Handle incoming data channel messages
    const handleDataMessage = useCallback((senderId: string, data: any) => {
        // Check if it's metadata (JSON string) or chunk (ArrayBuffer)
        if (typeof data === "string") {
            try {
                const msg = JSON.parse(data);
                if (msg.type === "file-start") {
                    console.log(`📂 Receiving file ${msg.name} from ${senderId}`);
                    fileTransferRefs.current.set(senderId, {
                        fileName: msg.name,
                        fileSize: msg.size,
                        receivedSize: 0,
                        chunks: [],
                        isReceiving: true,
                        senderId: senderId
                    });
                }
            } catch (e) {
                console.error("Parsed invalid JSON on data channel", e);
            }
        } else if (data instanceof ArrayBuffer) {
            const transfer = fileTransferRefs.current.get(senderId);
            if (transfer && transfer.isReceiving) {
                transfer.chunks.push(data);
                transfer.receivedSize += data.byteLength;

                if (transfer.receivedSize >= transfer.fileSize) {
                    console.log(`✅ File ${transfer.fileName} received completely!`);
                    const blob = new Blob(transfer.chunks);
                    const url = URL.createObjectURL(blob);

                    setReceivedFiles(prev => [...prev, {
                        name: transfer.fileName,
                        url: url,
                        sender: senderId
                    }]);

                    fileTransferRefs.current.delete(senderId);
                }
            }
        }
    }, []);

    const createPeer = (targetId: string, initiator: boolean) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit("ice", { target: targetId, candidate: e.candidate });
            }
        };

        pc.ontrack = (e) => {
            const stream = e.streams[0];
            console.log(`🎥 Received stream from ${targetId} (Tracks: ${stream.getTracks().length})`);

            // Ensure we update state even if tracks change on same stream ID
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(targetId, stream);
                return newMap;
            });

            // Listen for track removals/additions?
            stream.onaddtrack = () => setRemoteStreams(prev => new Map(prev));
            stream.onremovetrack = () => setRemoteStreams(prev => new Map(prev));
        };

        // Data Channel Logic
        if (initiator) {
            const dc = pc.createDataChannel("file-transfer");
            dc.onopen = () => console.log(`💾 Data Channel open with ${targetId}`);
            dc.onmessage = (e) => handleDataMessage(targetId, e.data);
            dataChannelsRef.current.set(targetId, dc);
        } else {
            pc.ondatachannel = (e) => {
                const dc = e.channel;
                console.log(`💾 Data Channel received from ${targetId}`);
                dc.onopen = () => console.log("💾 Data Channel open (receiver)");
                dc.onmessage = (e) => handleDataMessage(targetId, e.data);
                dataChannelsRef.current.set(targetId, dc);
            };
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        peersRef.current.set(targetId, pc);
        return pc;
    };

    useEffect(() => {
        if (!roomId) return;

        socket.emit("join-room", roomId);

        socket.on("all-users", (users: string[]) => {
            const peersArr: string[] = [];
            users.forEach(userID => {
                const pc = createPeer(userID, true); // Initiator
                peersRef.current.set(userID, pc);
                peersArr.push(userID);

                pc.createOffer().then(offer => {
                    pc.setLocalDescription(offer);
                    socket.emit("offer", { target: userID, sdp: offer });
                });
            });
            setPeers(peersArr);
        });

        socket.on("offer", async (payload) => {
            const pc = createPeer(payload.callerId, false); // Receiver
            peersRef.current.set(payload.callerId, pc);

            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("answer", { target: payload.callerId, sdp: answer });
            setPeers(prev => [...prev, payload.callerId]);
        });

        socket.on("answer", (payload) => {
            const pc = peersRef.current.get(payload.callerId);
            if (pc) {
                pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            }
        });

        socket.on("ice", (payload) => {
            const pc = peersRef.current.get(payload.callerId);
            if (pc) {
                pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
        });

        socket.on("user-left", (userId: string) => {
            if (peersRef.current.has(userId)) {
                peersRef.current.get(userId)?.close();
                peersRef.current.delete(userId);
            }
            if (dataChannelsRef.current.has(userId)) {
                dataChannelsRef.current.get(userId)?.close();
                dataChannelsRef.current.delete(userId);
            }
            setPeers(prev => prev.filter(id => id !== userId));
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
            });
        });

        return () => {
            socket.off("all-users");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice");
            socket.off("user-left");

            peersRef.current.forEach(pc => pc.close());
            peersRef.current.clear();
            dataChannelsRef.current.forEach(dc => dc.close());
            dataChannelsRef.current.clear();

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
            }
            setRemoteStreams(new Map());
        };

    }, [roomId]);

    const toggleAudio = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
            setIsMuted(prev => !prev);
        }
    };

    const toggleVideo = () => {
        // Intentionally empty or handled by prop if we want hard toggle
        // The prop handles the hard mounting of tracks.
        // This function could just toggle enabled state if track exists
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !t.enabled);
            // Update state to reflect 'mute' status, not 'presence' status
            // But for now page.tsx drives 'presence' via videoEnabled prop
        }
    };

    const leaveRoom = () => {
        socket.emit("disconnect");
    }

    const broadcastFile = async (file: File) => {
        if (dataChannelsRef.current.size === 0) return;

        console.log(`📤 Broadcasting file: ${file.name}`);
        const CHUNK_SIZE = 16384;

        // 1. Send Metadata to ALL
        const metadata = JSON.stringify({ type: "file-start", name: file.name, size: file.size });
        dataChannelsRef.current.forEach(dc => {
            if (dc.readyState === "open") dc.send(metadata);
        });

        // 2. Read and Send Chunks
        const arrayBuffer = await file.arrayBuffer();
        for (let i = 0; i < arrayBuffer.byteLength; i += CHUNK_SIZE) {
            const chunk = arrayBuffer.slice(i, i + CHUNK_SIZE);
            dataChannelsRef.current.forEach(dc => {
                if (dc.readyState === "open") dc.send(chunk);
            });
        }
    }

    return {
        localStream,
        remoteStreams,
        peers,
        toggleAudio,
        toggleVideo,
        isMuted,
        isVideoOff,
        leaveRoom,
        broadcastFile,
        receivedFiles
    };
};
