import { Router } from 'express';

import prisma from '../../database/db.js';

const profileRouter = Router();



profileRouter.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch user from DB, and include their EmployeeProfile data if it exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Determine who they report to based on their role
        let reportText = "";
        
        if (user.role === 'ADMIN') {
            reportText = "You are Admin. You have full system access.";
        } else if (user.role === 'HR') {
            // HR reports to ADMIN
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
            reportText = admin ? `Reporting to Admin: ${admin.displayName}` : "Reporting to Admin (Not Assigned)";
        } else {
            // EMPLOYEE reports to HR (or Admin if no HR exists yet)
            const hr = await prisma.user.findFirst({ where: { role: 'HR' } });
            if (hr) {
                reportText = `Reporting to HR: ${hr.displayName} (${hr.email})`;
            } else {
                const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
                reportText = admin ? `Reporting to Admin: ${admin.displayName}` : "No manager assigned yet.";
            }
        }

        const profileData = {
            companyName: "SyncWork Inc.",
            employeeId: user.employeeId,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            avatar: user.profile?.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`,
            reportingTo: reportText,
            department: user.profile?.department,
            jobTitle: user.profile?.designation,
            salary: user.profile?.baseSalary ? `$${user.profile.baseSalary}/month` : undefined,
            phone: user.profile?.phone,
            address: user.profile?.address
        };

        return res.status(200).json({ success: true, profile: profileData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

export default profileRouter;
