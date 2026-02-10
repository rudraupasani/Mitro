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

export const useWebRTC = (roomId: string, username: string, videoEnabled: boolean = true, audioEnabled: boolean = true) => {
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
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');

    // --- 1. Media Management Effect ---
    useEffect(() => {
        let mounted = true;

        const initMedia = async () => {
            try {
                console.log(`🎥 Requesting User Media: Audio=${audioEnabled}, Video=${videoEnabled}`);
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000
                    },

                    video: videoEnabled ? {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 60 },
                        facingMode: currentFacingMode,
                    } : false
                });

                if (!mounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                // Stop old tracks if they exist
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(t => t.stop());
                }

                localStreamRef.current = stream;
                setLocalStream(stream);

                // Log audio tracks to verify they exist
                const audioTracks = stream.getAudioTracks();
                console.log(`🔊 Audio tracks in local stream: ${audioTracks.length}`);
                audioTracks.forEach((track, idx) => {
                    console.log(`  Track ${idx}: enabled=${track.enabled}, readyState=${track.readyState}, label=${track.label}`);
                });

                // Update tracks for all existing peers
                peersRef.current.forEach((pc, peerId) => {
                    const senders = pc.getSenders();

                    // 1. Add or Replace tracks
                    stream.getTracks().forEach(newTrack => {
                        const existingSender = senders.find(s => s.track?.kind === newTrack.kind);
                        if (existingSender) {
                            console.log(`🔄 Replacing ${newTrack.kind} track for ${peerId}`);
                            existingSender.replaceTrack(newTrack).catch(e => console.error("Replace track failed", e));
                        } else {
                            console.log(`➕ Adding new ${newTrack.kind} track for ${peerId}`);
                            pc.addTrack(newTrack, stream);
                        }
                    });

                    // 2. Remove tracks that are no longer in the new stream
                    senders.forEach(sender => {
                        if (sender.track && !stream.getTracks().find(t => t.kind === sender.track!.kind)) {
                            console.log(`➖ Removing ${sender.track.kind} track for ${peerId}`);
                            pc.removeTrack(sender);
                        }
                    });

                    // 3. Trigger Offer to sync changes (renegotiation)
                    pc.createOffer().then(offer => {
                        pc.setLocalDescription(offer);
                        socket.emit("offer", { target: peerId, sdp: offer });
                    }).catch(console.error);
                });

            } catch (err) {
                console.error("Failed to get local stream", err);
            }
        };

        initMedia();

        return () => {
            mounted = false;
        };
    }, [videoEnabled, audioEnabled]);

    // --- 2. Signaling Effect ---
    useEffect(() => {
        if (!roomId) return;

        const handleDataMessage = (senderId: string, data: any) => {
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
        };

        const createPeer = (targetId: string, initiator: boolean) => {
            if (peersRef.current.has(targetId)) {
                return peersRef.current.get(targetId)!;
            }

            console.log(`🆕 Creating new Peer Connection for ${targetId} (Initiator: ${initiator})`);
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
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.set(targetId, stream);
                    return newMap;
                });
            };

            if (initiator) {
                const dc = pc.createDataChannel("file-transfer");
                dc.onopen = () => console.log(`💾 Data Channel open with ${targetId}`);
                dc.onmessage = (e) => handleDataMessage(targetId, e.data);
                dataChannelsRef.current.set(targetId, dc);
            } else {
                pc.ondatachannel = (e) => {
                    const dc = e.channel;
                    dc.onmessage = (e) => handleDataMessage(targetId, e.data);
                    dataChannelsRef.current.set(targetId, dc);
                };
            }

            // Add local tracks if available
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    console.log(`➕ Adding ${track.kind} track to peer ${targetId}, enabled=${track.enabled}`);
                    pc.addTrack(track, localStreamRef.current!);
                });
            }

            peersRef.current.set(targetId, pc);
            return pc;
        };

        socket.emit("join-room", roomId);

        const onAllUsers = (users: string[]) => {
            console.log("👥 Received all-users:", users);
            const peersArr: string[] = [];
            users.forEach(userID => {
                const pc = createPeer(userID, true);
                peersArr.push(userID);
                pc.createOffer().then(offer => {
                    pc.setLocalDescription(offer);
                    socket.emit("offer", { target: userID, sdp: offer });
                });
            });
            setPeers(peersArr);
        };

        const onOffer = async (payload: { target: string, callerId: string, sdp: RTCSessionDescriptionInit }) => {
            // Initiate peer if not exists, otherwise REUSE
            const pc = createPeer(payload.callerId, false);

            console.log(`📨 Received Offer from ${payload.callerId}`);

            // Avoid "have-local-offer" collision if both sides offer? (Simplify for now)
            if (pc.signalingState !== "stable" && pc.signalingState !== "have-remote-offer") {
                // Determine collision resolution (polite vs impolite peer) if needed.
                // For now, we proceed, but if we catch error, we might log it.
                // Or if we just created it, it is 'stable'.
            }

            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

            // Flush buffered ICE candidates here if we had any logic for that

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { target: payload.callerId, sdp: answer });

            setPeers(prev => prev.includes(payload.callerId) ? prev : [...prev, payload.callerId]);
        };

        const onAnswer = async (payload: { callerId: string, sdp: RTCSessionDescriptionInit }) => {
            console.log(`📨 Received Answer from ${payload.callerId}`);
            const pc = peersRef.current.get(payload.callerId);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            }
        };

        const onIce = (payload: { callerId: string, candidate: RTCIceCandidateInit }) => {
            const pc = peersRef.current.get(payload.callerId);
            if (pc) {
                const candidate = new RTCIceCandidate(payload.candidate);
                // Basic trick handling: only add if remote description is set
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    pc.addIceCandidate(candidate).catch(e => console.error("Error adding ice candidate", e));
                }
            }
        };

        const onUserLeft = (userId: string) => {
            console.log(`👋 User left: ${userId}`);
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
        };

        socket.on("all-users", onAllUsers);
        socket.on("offer", onOffer);
        socket.on("answer", onAnswer);
        socket.on("ice", onIce);
        socket.on("user-left", onUserLeft);

        return () => {
            socket.off("all-users", onAllUsers);
            socket.off("offer", onOffer);
            socket.off("answer", onAnswer);
            socket.off("ice", onIce);
            socket.off("user-left", onUserLeft);

            peersRef.current.forEach(pc => pc.close());
            peersRef.current.clear();
            dataChannelsRef.current.forEach(dc => dc.close());
            dataChannelsRef.current.clear();
            setRemoteStreams(new Map());
            setPeers([]);
        };

    }, [roomId]);

    const toggleAudio = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
            setIsMuted(prev => !prev);
        }
    };

    const toggleVideo = () => {
        // Only toggle video tracks, NEVER touch audio tracks
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            videoTracks.forEach(t => {
                t.enabled = !t.enabled;
                console.log(`🎥 Video track toggled: enabled=${t.enabled}`);
            });

            // Verify audio tracks remain enabled
            const audioTracks = localStreamRef.current.getAudioTracks();
            audioTracks.forEach(t => {
                if (!t.enabled) {
                    console.warn('⚠️ Audio track was disabled, re-enabling');
                    t.enabled = true;
                }
            });
        }
    };

    const leaveRoom = () => {
        socket.disconnect();
    };

    const broadcastFile = async (file: File) => {
        if (dataChannelsRef.current.size === 0) return;
        console.log(`📤 Broadcasting file: ${file.name}`);
        const CHUNK_SIZE = 16384;
        const metadata = JSON.stringify({ type: "file-start", name: file.name, size: file.size });
        dataChannelsRef.current.forEach(dc => {
            if (dc.readyState === "open") dc.send(metadata);
        });
        const arrayBuffer = await file.arrayBuffer();
        for (let i = 0; i < arrayBuffer.byteLength; i += CHUNK_SIZE) {
            const chunk = arrayBuffer.slice(i, i + CHUNK_SIZE);
            dataChannelsRef.current.forEach(dc => {
                if (dc.readyState === "open") dc.send(chunk);
            });
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }
            setIsScreenSharing(false);
            // Revert to camera
            if (localStreamRef.current) {
                const cameraTrack = localStreamRef.current.getVideoTracks()[0];
                peersRef.current.forEach((pc) => {
                    const senders = pc.getSenders();
                    const videoSender = senders.find((s) => s.track?.kind === "video");
                    if (videoSender && cameraTrack) videoSender.replaceTrack(cameraTrack);
                });
                setLocalStream(localStreamRef.current);
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = stream.getVideoTracks()[0];
                screenStreamRef.current = stream;
                setIsScreenSharing(true);

                peersRef.current.forEach((pc) => {
                    const senders = pc.getSenders();
                    const videoSender = senders.find((s) => s.track?.kind === "video");
                    if (videoSender) videoSender.replaceTrack(screenTrack);
                });

                if (localStreamRef.current) {
                    const audioTracks = localStreamRef.current.getAudioTracks();
                    const newStream = new MediaStream([...audioTracks, screenTrack]);
                    setLocalStream(newStream);
                }

                // Handle recursive stop
                screenTrack.onended = () => {
                    // We can't easily call the same function recursively if it's async/state dependent without being careful
                    // But we can manually execute the stop logic:
                    if (screenStreamRef.current) {
                        screenStreamRef.current.getTracks().forEach(t => t.stop());
                        screenStreamRef.current = null;
                    }
                    setIsScreenSharing(false);
                    if (localStreamRef.current) {
                        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
                        peersRef.current.forEach((pc) => {
                            const senders = pc.getSenders();
                            const videoSender = senders.find((s) => s.track?.kind === "video");
                            if (videoSender && cameraTrack) videoSender.replaceTrack(cameraTrack);
                        });
                        setLocalStream(localStreamRef.current);
                    }
                };
            } catch (err) { console.error("Failed to share screen", err); }
        }
    };

    const switchCamera = async () => {
        if (!videoEnabled || isScreenSharing) return;

        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        console.log(`📷 Switching camera from ${currentFacingMode} to ${newFacingMode}`);

        try {
            // Get new video stream with opposite facing mode
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                },
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 60 },
                    facingMode: newFacingMode
                }
            });

            const newVideoTrack = newStream.getVideoTracks()[0];
            const audioTracks = localStreamRef.current?.getAudioTracks() || [];

            // Stop old video track
            if (localStreamRef.current) {
                localStreamRef.current.getVideoTracks().forEach(track => track.stop());
            }

            // Create new stream with new video and existing audio
            const combinedStream = new MediaStream([...audioTracks, newVideoTrack]);
            localStreamRef.current = combinedStream;
            setLocalStream(combinedStream);
            setCurrentFacingMode(newFacingMode);

            // Update video track for all peers
            peersRef.current.forEach((pc, peerId) => {
                const senders = pc.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');
                if (videoSender) {
                    console.log(`🔄 Replacing video track for ${peerId}`);
                    videoSender.replaceTrack(newVideoTrack).catch(e => console.error('Failed to replace video track', e));
                }
            });

            console.log('✅ Camera switched successfully');
        } catch (err) {
            console.error('Failed to switch camera:', err);
        }
    };

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
        receivedFiles,
        isScreenSharing,
        toggleScreenShare,
        switchCamera,
        currentFacingMode
    };
};
