import { io } from "socket.io-client";

// Connect to the standalone server on port 3001
export const socket = io("http://localhost:3001", {
    transports: ["websocket", "polling"],
});
