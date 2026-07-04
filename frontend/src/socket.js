import { io } from "socket.io-client";

// Connect to the root server (which hosts Socket.io on /socket.io)
export const socket = io(import.meta.env.VITE_BACKEND_HOST, {
  path: '/socket.io',
  autoConnect: false,
  reconnection: true,
  auth: {
    token: sessionStorage.getItem('hrms_react_token')
  }
});

// Update the auth token on reconnects
socket.on("connect", () => {
  socket.auth.token = sessionStorage.getItem('hrms_react_token');
});
