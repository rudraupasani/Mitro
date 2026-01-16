import { io } from "socket.io-client";

export const socket = io("https://room-server-7det.onrender.com", {
    transports: ["polling", "websocket"],
});
