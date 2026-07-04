import { Router } from "express";
import prisma from '../database/db.js';
import authRouter from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";
import profileRouter from "./routes/profile.js";
import employeeRouter from "./routes/employee.js";
import leaveRouter from "./routes/leave.js";
import payrollRouter from "./routes/payroll.js";
import chatRouter from "./routes/chat.js";
import attendanceRouter from "./routes/attendance.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { getRateLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// Apply strict rate limiting (Type 1: 4 tries / 10 mins) to authentication routes
router.use("/auth", getRateLimiter(1), authRouter);

// Secure protected routes with verifyToken here in the central router
router.use("/dashboard", verifyToken, dashboardRouter);
router.use("/profile", verifyToken, profileRouter);
router.use("/employees", verifyToken, employeeRouter);
router.use("/leaves", verifyToken, leaveRouter);
router.use("/payroll", verifyToken, payrollRouter);
router.use("/chat", verifyToken, chatRouter);
router.use("/attendance", verifyToken, attendanceRouter);

// Health check endpoint
router.get("/health", (req, res) => {
	res.json({ status: "OK" });
});

// Seed endpoint for testing UI
router.get("/seed-ui", async (req, res) => {
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

export default router;
