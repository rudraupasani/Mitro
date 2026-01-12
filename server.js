const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
    });
    res.end("Signaling Server Running");
});

const io = new Server(server, {
    cors: {
        origin: "https://filezy.onrender.com",
        methods: ["GET", "POST"],
    },
});

const socketToRoom = {};

io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        socketToRoom[socket.id] = roomId;

        const room = io.sockets.adapter.rooms.get(roomId);
        const users = room ? Array.from(room) : [];

        // Filter out self
        const otherUsers = users.filter((id) => id !== socket.id);

        // Send list of existing users to the new joiner
        socket.emit("all-users", otherUsers);

        console.log(`👤 ${socket.id} joined room ${roomId}. Users: ${users.length}`);
    });

    socket.on("offer", (payload) => {
        io.to(payload.target).emit("offer", {
            sdp: payload.sdp,
            callerId: socket.id
        });
    });

    socket.on("answer", (payload) => {
        io.to(payload.target).emit("answer", {
            sdp: payload.sdp,
            callerId: socket.id
        });
    });

    socket.on("ice", (payload) => {
        io.to(payload.target).emit("ice", {
            candidate: payload.candidate,
            callerId: socket.id
        });
    });

    socket.on("disconnect", () => {
        const roomId = socketToRoom[socket.id];
        let room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
            socket.to(roomId).emit("user-left", socket.id);
        }
        delete socketToRoom[socket.id];
        console.log("❌ User disconnected:", socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`🚀 Signaling server running on http://localhost:${PORT}`);
});
