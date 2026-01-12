import { io } from "socket.io-client";

// Connect to the standalone server on port 3001
export const socket = io("https://filezy.vercel.app", {
    transports: ["websocket", "polling"],
});
