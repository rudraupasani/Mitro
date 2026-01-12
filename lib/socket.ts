import { io } from "socket.io-client";

export const socket = io("https://filezy.onrender.com", {
    transports: ["websocket"],
});
