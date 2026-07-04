import { Router } from 'express';
import prisma from '../../database/db.js';
import crypto from 'crypto';
import multer from 'multer';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const chatRouter = Router();

// DOMPurify setup for backend sanitization 
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ─── GET /users — Search employees to chat with ───
chatRouter.get('/users', async (req, res) => {
    const currentUserId = req.user.id;
    const search = req.query.search || "";

    try {
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                OR: [
                    { displayName: { contains: search, mode: 'insensitive' } },
                    { employeeId: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                employeeId: true,
                displayName: true,
                email: true,
                publicKey: true,
                profile: { select: { profilePictureUrl: true, department: true } }
            },
            take: 10
        });

        // AUTO-SEED FOR UI TESTING: If there are fewer than 5 users in the DB, inject dummy users
        if (users.length < 5 && search === "") {
            const passwordHash = await prisma.user.findFirst().then(u => u?.passwordHash || "dummy");
            const dummyData = [
                { displayName: "Alice Smith", email: "alice@syncwork.com", employeeId: "10001", department: "Engineering", title: "Software Engineer" },
                { displayName: "Bob Johnson", email: "bob@syncwork.com", employeeId: "10002", department: "Marketing", title: "Marketing Manager" },
                { displayName: "Charlie Davis", email: "charlie@syncwork.com", employeeId: "10003", department: "Sales", title: "Sales Exec" },
                { displayName: "Diana Prince", email: "diana@syncwork.com", employeeId: "10004", department: "HR", title: "HR Rep" },
                { displayName: "Evan Wright", email: "evan@syncwork.com", employeeId: "10005", department: "Operations", title: "Ops Manager" }
            ];
            for (const d of dummyData) {
                const exists = await prisma.user.findUnique({ where: { email: d.email } });
                if (!exists) {
                    const newU = await prisma.user.create({
                        data: {
                            displayName: d.displayName,
                            email: d.email,
                            employeeId: d.employeeId,
                            passwordHash: passwordHash,
                            publicKey: "123456789",
                            profile: { create: { department: d.department, designation: d.title, baseSalary: 5000, profilePictureUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(d.displayName)}&background=random` } }
                        },
                        select: { id: true, employeeId: true, displayName: true, email: true, publicKey: true, profile: { select: { profilePictureUrl: true, department: true } } }
                    });
                    users.push(newU);
                }
            }
        }
        res.json({ users });
    } catch (err) {
        console.error("Fetch users error:", err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ─── POST /direct — Find or create a 1-on-1 conversation ─── {group is not an option}
chatRouter.get('/seed-dummy', async (req, res) => {
    try {
        const passwordHash = await prisma.user.findFirst().then(u => u?.passwordHash || "dummy");
        const dummyUsers = [
            { displayName: "Alice Smith", email: "alice@syncwork.com", employeeId: "10001", department: "Engineering", title: "Software Engineer" },
            { displayName: "Bob Johnson", email: "bob@syncwork.com", employeeId: "10002", department: "Marketing", title: "Marketing Manager" },
            { displayName: "Charlie Davis", email: "charlie@syncwork.com", employeeId: "10003", department: "Sales", title: "Sales Exec" },
            { displayName: "Diana Prince", email: "diana@syncwork.com", employeeId: "10004", department: "HR", title: "HR Rep" },
            { displayName: "Evan Wright", email: "evan@syncwork.com", employeeId: "10005", department: "Operations", title: "Ops Manager" }
        ];
        
        for (const u of dummyUsers) {
            const exists = await prisma.user.findUnique({ where: { email: u.email } });
            if (!exists) {
                await prisma.user.create({
                    data: {
                        displayName: u.displayName,
                        email: u.email,
                        employeeId: u.employeeId,
                        passwordHash: passwordHash,
                        publicKey: "123456789",
                        profile: {
                            create: {
                                department: u.department,
                                designation: u.title,
                                baseSalary: 5000,
                                profilePictureUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=random`
                            }
                        }
                    }
                });
            }
        }
        res.json({ success: true, message: "Dummy users seeded" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

chatRouter.post('/direct', async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    if (!targetUserId) return res.status(400).json({ error: "targetUserId is required" });

    try {
        // Check if a 1-on-1 conversation already exists between these two users
        const existing = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: currentUserId } } },
                    { participants: { some: { userId: targetUserId } } }
                ],
                participants: { every: { userId: { in: [currentUserId, targetUserId] } } }
            }
        });

        if (existing) {
            return res.json({ conversation_id: existing.id });
        }

        // Create new conversation in a transaction (NO GORUP)
        const newConvo = await prisma.$transaction(async (tx) => {
            const convo = await tx.conversation.create({
                data: {
                    createdAt: BigInt(Date.now()),
                    participants: {
                        create: [
                            { userId: currentUserId },
                            { userId: targetUserId }
                        ]
                    }
                }
            });
            return convo;
        });

        res.json({ conversation_id: newConvo.id });
    } catch (err) {
        console.error("Create direct conversation error:", err);
        res.status(500).json({ error: "Failed to create conversation" });
    }
});

// ─── GET /conversations — List all active conversations for the current user ───
chatRouter.get('/conversations', async (req, res) => {
    const currentUserId = req.user.id;

    try {
        // Get all conversations the user is part of
        const participations = await prisma.conversationParticipant.findMany({
            where: { userId: currentUserId },
            include: {
                conversation: {
                    include: {
                        participants: {
                            where: { userId: { not: currentUserId } },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        displayName: true,
                                        employeeId: true,
                                        publicKey: true,
                                        profile: { select: { profilePictureUrl: true } }
                                    }
                                }
                            }
                        },
                        messages: {
                            orderBy: { timestamp: 'desc' },
                            take: 1,
                            select: { message: true, senderId: true, timestamp: true, id: true }
                        }
                    }
                }
            }
        });

        const conversations = participations.map(p => {
            const otherUser = p.conversation.participants[0]?.user;
            const lastMsg = p.conversation.messages[0];
            // Count unread: messages with id > lastReadMessageId that aren't from me
            const unreadCountPromise = prisma.message.count({
                where: {
                    conversationId: p.conversationId,
                    id: { gt: p.lastReadMessageId },
                    senderId: { not: currentUserId }
                }
            });

            return {
                id: p.conversation.id,
                otherUser: otherUser ? {
                    id: otherUser.id,
                    displayName: otherUser.displayName,
                    employeeId: otherUser.employeeId,
                    publicKey: otherUser.publicKey,
                    profilePicture: otherUser.profile?.profilePictureUrl
                } : null,
                lastMessage: lastMsg ? {
                    message: lastMsg.message,
                    senderId: lastMsg.senderId,
                    timestamp: lastMsg.timestamp.toString()
                } : null,
                _unreadPromise: unreadCountPromise
            };
        });

        // Resolve all unread count promises
        const resolved = await Promise.all(
            conversations.map(async (c) => {
                const unreadCount = await c._unreadPromise;
                const { _unreadPromise, ...rest } = c;
                return { ...rest, unreadCount };
            })
        );

        // Sort by last message timestamp descending
        resolved.sort((a, b) => {
            const tA = a.lastMessage ? BigInt(a.lastMessage.timestamp) : BigInt(0);
            const tB = b.lastMessage ? BigInt(b.lastMessage.timestamp) : BigInt(0);
            return tB > tA ? 1 : tB < tA ? -1 : 0;
        });

        res.json({ conversations: resolved });
    } catch (err) {
        console.error("Fetch conversations error:", err);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

// ─── POST /message — Send an encrypted message ───
chatRouter.post('/message', async (req, res) => {
    let { conversation_id, message, recipient } = req.body;
    const senderId = req.user.id;

    // Sanitize
    message = DOMPurify.sanitize(message);
    if (!message || message.trim() === "") {
        return res.status(400).json({ error: "Message content cannot be empty" });
    }
    const messageText = message.trim();

    const processMessage = async (convoId) => {
        // Security check: must be a participant
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: { conversationId: convoId, userId: senderId }
            }
        });

        if (!participant) {
            return res.status(403).json({ error: "Access denied: Not a participant in this conversation." });
        }

        const timestamp = BigInt(Date.now());
        const newMessage = await prisma.message.create({
            data: {
                conversationId: convoId,
                senderId: senderId,
                message: messageText,
                timestamp: timestamp
            }
        });

        // Emit via Socket.io
        const io = req.app.get("socketio");
        if (io) {
            io.to(convoId).emit("new_message", {
                id: newMessage.id,
                conversation_id: convoId,
                sender_id: senderId,
                message: messageText,
                timestamp: timestamp.toString()
            });
        }

        res.json({
            success: true,
            message: "Message sent successfully",
            id: newMessage.id,
            timestamp: timestamp.toString(),
            conversation_id: convoId
        });
    };

    try {
        if (!conversation_id && recipient) {
            // Auto-resolve recipient to conversation
            const existing = await prisma.conversation.findFirst({
                where: {
                    AND: [
                        { participants: { some: { userId: senderId } } },
                        { participants: { some: { userId: recipient } } }
                    ],
                    participants: { every: { userId: { in: [senderId, recipient] } } }
                }
            });

            if (existing) {
                await processMessage(existing.id);
            } else {
                // Create new convo on the fly
                const newConvo = await prisma.$transaction(async (tx) => {
                    const convo = await tx.conversation.create({
                        data: {
                            createdAt: BigInt(Date.now()),
                            participants: {
                                create: [
                                    { userId: senderId },
                                    { userId: recipient }
                                ]
                            }
                        }
                    });
                    return convo;
                });

                // Join socket room
                const io = req.app.get("socketio");
                if (io) {
                    const userSockets = req.app.get("userSockets");
                    if (userSockets) {
                        const senderSocketId = userSockets.get(senderId);
                        const recipientSocketId = userSockets.get(recipient);
                        if (senderSocketId) {
                            io.sockets.sockets.get(senderSocketId)?.join(newConvo.id);
                        }
                        if (recipientSocketId) {
                            io.sockets.sockets.get(recipientSocketId)?.join(newConvo.id);
                        }
                    }
                }

                await processMessage(newConvo.id);
            }
        } else if (conversation_id) {
            await processMessage(conversation_id);
        } else {
            return res.status(400).json({ error: "conversation_id or recipient is required" });
        }
    } catch (err) {
        console.error("Send message error:", err);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// ─── GET /public-key/:userId — Fetch a user's public key for DH exchange ───
chatRouter.get('/public-key/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { publicKey: true }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ public_key: user.publicKey });
    } catch (err) {
        console.error("Fetch public key error:", err);
        res.status(500).json({ error: "Failed to fetch public key" });
    }
});

// ─── GET /history/:conversationId — Fetch paginated encrypted message history ───
chatRouter.get('/history/:conversationId', async (req, res) => {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const currentUserId = req.user.id;

    try {
        // Security check: must be a participant
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: { conversationId, userId: currentUserId }
            }
        });

        if (!participant) {
            return res.status(403).json({ error: "Access denied: Not a participant in this conversation." });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip: offset,
            select: {
                id: true,
                conversationId: true,
                senderId: true,
                message: true,
                timestamp: true
            }
        });

        // Reverse to chronological order and stringify BigInts
        const formatted = messages.reverse().map(m => ({
            ...m,
            timestamp: m.timestamp.toString()
        }));

        res.json({ messages: formatted });
    } catch (err) {
        console.error("Fetch history error:", err);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// ─── POST /read — Mark messages as read ───
chatRouter.post('/read', async (req, res) => {
    const { conversation_id, last_read_message_id } = req.body;
    const currentUserId = req.user.id;

    if (!conversation_id || !last_read_message_id) {
        return res.status(400).json({ error: "Missing params" });
    }

    try {
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: { conversationId: conversation_id, userId: currentUserId }
            }
        });

        if (!participant) return res.status(403).json({ error: "Access denied" });

        await prisma.conversationParticipant.update({
            where: {
                conversationId_userId: { conversationId: conversation_id, userId: currentUserId }
            },
            data: { lastReadMessageId: last_read_message_id }
        });

        res.json({ success: true });
    } catch (err) {
        console.error("Mark read error:", err);
        res.status(500).json({ error: "Failed to mark as read" });
    }
});

// ─── POST /upload — File attachments via Multer ───
chatRouter.post('/upload', upload.array('files', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
    }

    const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        path: `/uploads/${file.filename}`
    }));

    res.status(200).json({
        message: "Attachments successful",
        files: uploadedFiles
    });
});

// ─── PUT /vault — Store encrypted private key vault on server ───
chatRouter.put('/vault', async (req, res) => {
    const { publicKey, encryptedPrivateKey, keySalt, keyIv } = req.body;
    const currentUserId = req.user.id;

    if (!publicKey || !encryptedPrivateKey || !keySalt || !keyIv) {
        return res.status(400).json({ error: "All vault fields are required" });
    }

    try {
        await prisma.user.update({
            where: { id: currentUserId },
            data: { publicKey, encryptedPrivateKey, keySalt, keyIv }
        });
        res.json({ success: true });
    } catch (err) {
        console.error("Store vault error:", err);
        res.status(500).json({ error: "Failed to store vault" });
    }
});

// ─── GET /vault — Retrieve encrypted private key vault from server ───
chatRouter.get('/vault', async (req, res) => {
    const currentUserId = req.user.id;

    try {
        const user = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { publicKey: true, encryptedPrivateKey: true, keySalt: true, keyIv: true }
        });

        if (!user || !user.encryptedPrivateKey) {
            return res.json({ hasVault: false });
        }

        res.json({
            hasVault: true,
            vault: {
                publicKey: user.publicKey,
                encrypted_private_key: user.encryptedPrivateKey,
                key_salt: user.keySalt,
                key_iv: user.keyIv
            }
        });
    } catch (err) {
        console.error("Fetch vault error:", err);
        res.status(500).json({ error: "Failed to fetch vault" });
    }
});

export default chatRouter;
