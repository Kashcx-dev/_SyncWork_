import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import router from "./router.js";
import prisma from "../database/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for chat uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", router);

// Global 404 Error Handler
app.use((req, res, next) => {
	res.status(404).json({ message: "Route not found" });
});

// Global Error Handler (catches 500s)
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ message: "Something went wrong on the server!" });
});

// ─── Socket.io Integration ───

const server = http.createServer(app);
const io = new Server(server, {
	cors: { origin: "*" },
});

const userSockets = new Map();
const userStatuses = new Map();

// Socket.io JWT Authentication Middleware
io.use((socket, next) => {
	const token = socket.handshake.auth.token;
	if (!token) {
		return next(new Error("Socket Auth: No token provided"));
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		socket.user = decoded;
		next();
	} catch (err) {
		return next(new Error("Socket Auth: Invalid or expired token"));
	}
});

io.on("connection", async (socket) => {
	const userId = socket.user.id;
	const displayName = socket.user.displayName || userId;

	userSockets.set(userId, socket.id);
	userStatuses.set(userId, "online");
	console.log(`[Socket] ${displayName} connected (JWT verified)`);

	// Broadcast that this user is online
	io.emit("status_update", { userId, status: "online" });

	// Send all current statuses to this new user
	socket.emit("initial_statuses", Object.fromEntries(userStatuses));

	// Auto-join all conversation rooms for this user
	try {
		const participations = await prisma.conversationParticipant.findMany({
			where: { userId },
			select: { conversationId: true },
		});
		participations.forEach((p) => socket.join(p.conversationId));
		console.log(
			`[Socket] ${displayName} joined ${participations.length} rooms`,
		);
	} catch (err) {
		console.error("Socket DB Error:", err);
	}

	socket.on("set_status", ({ status }) => {
		userStatuses.set(userId, status);
		io.emit("status_update", { userId, status });
	});

	// Allow frontend to dynamically join a new room (e.g., when starting a new chat)
	socket.on("join_room", (convoId) => {
		socket.join(convoId);
		console.log(`[Socket] ${displayName} dynamically joined room ${convoId}`);
	});

	socket.on("disconnect", () => {
		userSockets.delete(userId);
		userStatuses.set(userId, "offline");
		io.emit("status_update", { userId, status: "offline" });
		console.log(`[Socket] ${displayName} disconnected`);
	});
});

// Make io and userSockets accessible from route handlers
app.set("socketio", io);
app.set("userSockets", userSockets);

// Use server.listen instead of app.listen (required for Socket.io)
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
