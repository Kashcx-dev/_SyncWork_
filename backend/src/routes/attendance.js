import express from 'express';
import prisma from '../../database/db.js';

const attendanceRouter = express.Router();

// GET /api/attendance - Fetch attendance logs
attendanceRouter.get('/', async (req, res) => {
    try {
        const currentUser = req.user;
        let logs = [];

        if (currentUser.role === 'HR' || currentUser.role === 'ADMIN') {
            let whereClause = {};
            if (currentUser.role === 'HR') {
                const hrProfile = await prisma.employeeProfile.findUnique({ where: { userId: currentUser.id } });
                if (hrProfile && hrProfile.department) {
                    whereClause = { user: { profile: { department: hrProfile.department } } };
                }
            }
            logs = await prisma.attendance.findMany({
                where: whereClause,
                include: { user: true },
                orderBy: { date: 'desc' }
            });
        } else {
            logs = await prisma.attendance.findMany({
                where: { userId: currentUser.id },
                include: { user: true },
                orderBy: { date: 'desc' }
            });
        }

        const formattedLogs = logs.map(l => ({
            date: l.date.toISOString().split('T')[0],
            empId: l.user.employeeId,
            checkIn: new Date(l.checkInTime).toTimeString().split(" ")[0].slice(0, 5),
            checkOut: l.checkOutTime ? new Date(l.checkOutTime).toTimeString().split(" ")[0].slice(0, 5) : "",
            status: l.status === 'PRESENT' ? 'Present' : l.status === 'HALF_DAY' ? 'Half-day' : l.status === 'LEAVE' ? 'Leave' : 'Absent'
        }));

        res.status(200).json({ success: true, attendance: formattedLogs });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/attendance/clockin
attendanceRouter.post('/clockin', async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await prisma.attendance.findFirst({
            where: { userId, date: today }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Already clocked in today' });
        }

        await prisma.attendance.create({
            data: {
                userId,
                date: today,
                checkInTime: new Date(),
                status: 'PRESENT'
            }
        });

        res.status(200).json({ success: true, message: 'Clocked in successfully' });
    } catch (error) {
        console.error("Error clocking in:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/attendance/clockout
attendanceRouter.post('/clockout', async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await prisma.attendance.findFirst({
            where: { userId, date: today }
        });

        if (!existing || existing.checkOutTime) {
            return res.status(400).json({ success: false, message: 'Cannot clock out right now' });
        }

        await prisma.attendance.update({
            where: { id: existing.id },
            data: { checkOutTime: new Date() }
        });

        res.status(200).json({ success: true, message: 'Clocked out successfully' });
    } catch (error) {
        console.error("Error clocking out:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default attendanceRouter;
