import { Router } from 'express';

import prisma from '../../database/db.js';

const dashboardRouter = Router();



dashboardRouter.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role; // 'EMPLOYEE', 'ADMIN', or 'HR'

        // Admin or HR Dashboard Data
        if (role === 'ADMIN' || role === 'HR') {
            let employeeWhere = { role: 'EMPLOYEE' };
            let leaveWhere = { status: 'PENDING' };
            
            if (role === 'HR') {
                const hrProfile = await prisma.employeeProfile.findUnique({ where: { userId: userId } });
                if (hrProfile && hrProfile.department) {
                    employeeWhere.profile = { department: hrProfile.department };
                    leaveWhere.user = { profile: { department: hrProfile.department } };
                }
            }

            const totalEmployees = await prisma.user.count({ where: employeeWhere });
            const pendingLeaves = await prisma.leaveRequest.count({ where: leaveWhere });
            
            return res.status(200).json({
                role,
                data: {
                    totalEmployees,
                    pendingLeaves,
                    message: "Welcome to the Admin Dashboard!"
                }
            });
        }

        // Standard Employee Dashboard Data
        const recentAttendance = await prisma.attendance.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: 5
        });

        const myLeaves = await prisma.leaveRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        return res.status(200).json({
            role,
            data: {
                recentAttendance,
                myLeaves,
                message: "Welcome back to your Dashboard!"
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

export default dashboardRouter;
