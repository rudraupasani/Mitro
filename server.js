const http = require("http");
const { Server } = require("socket.io");

// Create HTTP server (no manual headers)
const server = http.createServer();

// Create Socket.IO server
const io = new Server(server, {
    cors: {
        origin: "*", // allow Vercel frontend
        methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"], // important for Render cold start
});

// Store socket → room mapping
const socketToRoom = {};

io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    // Join room
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        socketToRoom[socket.id] = roomId;

        const room = io.sockets.adapter.rooms.get(roomId);
        const users = room ? Array.from(room) : [];

        // Send existing users to new user
        socket.emit(
            "all-users",
            users.filter((id) => id !== socket.id)
        );

        console.log(`👤 ${socket.id} joined room ${roomId}`);
    });

    // WebRTC Offer
    socket.on("offer", ({ target, sdp }) => {
        io.to(target).emit("offer", {
            sdp,
            callerId: socket.id,
        });
    });

    // WebRTC Answer
    socket.on("answer", ({ target, sdp }) => {
        io.to(target).emit("answer", {
            sdp,
            callerId: socket.id,
        });
    });

    // ICE Candidate
    socket.on("ice", ({ target, candidate }) => {
        io.to(target).emit("ice", {
            candidate,
            callerId: socket.id,
        });
    });

    // Chat Message
    socket.on("chat-message", (messageData) => {
        const roomId = socketToRoom[socket.id];
        if (roomId) {
            // Broadcast to everyone in the room INCLUDING sender (for simplicity, or filter sender in UI)
            // Typically we want to emit to room.
            io.to(roomId).emit("chat-message", messageData);
        }
    });

    // Disconnect
    socket.on("disconnect", () => {
        const roomId = socketToRoom[socket.id];
        if (roomId) {
            socket.to(roomId).emit("user-left", socket.id);
            delete socketToRoom[socket.id];
        }
        console.log("❌ User disconnected:", socket.id);
    });
});

// IMPORTANT: Use Render port
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log("🚀 Signaling server running on port", PORT);
});
