import express from 'express';
import prisma from '../../database/db.js';
import sendEmail from '../../helper/mailer.js';

const employeeRouter = express.Router();

// GET /api/employees - Fetch all employees (HR/Admin only)
employeeRouter.get('/', async (req, res) => {
    try {
        const currentUser = req.user;
        if (currentUser.role !== 'HR' && currentUser.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const users = await prisma.user.findMany({
            include: {
                profile: true,
                payroll: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to frontend expected format
        const employees = users.map(u => {
            const baseSalary = u.profile?.baseSalary || 4500;
            return {
                empId: u.employeeId,
                name: u.displayName,
                email: u.email,
                role: u.role === 'HR' || u.role === 'ADMIN' ? 'HR' : 'Employee',
                avatar: u.profile?.profilePictureUrl || `https://ui-avatars.com/api/?name=${u.displayName}&background=random`,
                phone: u.profile?.phone || "",
                address: u.profile?.address || "",
                title: u.profile?.designation || "Associate",
                department: u.profile?.department || "Operations",
                salary: {
                    base: baseSalary,
                    allowances: baseSalary * 0.1, // Mock dynamic allowance
                    deductions: 200 // Mock deduction
                }
            };
        });

        res.status(200).json({ success: true, employees });
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/employees/:empId - Update employee details (HR/Admin only)
employeeRouter.put('/:empId', async (req, res) => {
    try {
        const currentUser = req.user;
        if (currentUser.role !== 'HR' && currentUser.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const { empId } = req.params;
        const { name, email, role, title, department } = req.body;

        // Find existing user
        const targetUser = await prisma.user.findUnique({
            where: { employeeId: empId },
            include: { profile: true }
        });

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Prevent HR from editing themselves or another HR
        if (currentUser.role === 'HR' && (targetUser.role === 'HR' || targetUser.role === 'ADMIN')) {
            return res.status(403).json({ success: false, message: 'HR cannot edit themselves or other administrative accounts' });
        }

        // Determine mapped Prisma role
        let mappedRole = targetUser.role;
        if (role) {
            if (role === 'HR') mappedRole = 'HR';
            if (role === 'Employee') mappedRole = 'EMPLOYEE';
        }

        // Update database
        const updatedUser = await prisma.user.update({
            where: { employeeId: empId },
            data: {
                displayName: name || targetUser.displayName,
                email: email || targetUser.email,
                role: mappedRole,
                profile: {
                    upsert: {
                        create: {
                            department: department,
                            designation: title,
                            baseSalary: 4500
                        },
                        update: {
                            department: department || targetUser.profile?.department,
                            designation: title || targetUser.profile?.designation
                        }
                    }
                }
            }
        });

        // Send Email Notification
        const mailOptions = {
            from: '"SyncWork HR" <' + process.env.EMAIL_USER + '>',
            to: targetUser.email,
            subject: 'Your Organizational Profile Has Been Updated',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333;">Profile Update Notification</h2>
                    <p>Hello ${targetUser.displayName},</p>
                    <p>An HR Administrator has recently updated your organizational profile in the SyncWork system.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <ul style="list-style-type: none; padding-left: 0;">
                            <li><strong>Name:</strong> ${updatedUser.displayName}</li>
                            <li><strong>Role:</strong> ${updatedUser.role}</li>
                            <li><strong>Job Title:</strong> ${title || targetUser.profile?.designation}</li>
                            <li><strong>Department:</strong> ${department || targetUser.profile?.department}</li>
                        </ul>
                    </div>
                    <p>If you believe this update was made in error, please contact your HR department immediately.</p>
                    <br/>
                    <p>Best Regards,</p>
                    <p><strong>SyncWork HR Team</strong></p>
                </div>
            `
        };

        // Don't await email, let it send in background
        sendEmail(mailOptions).catch(console.error);

        res.status(200).json({ success: true, message: 'Employee updated successfully' });
    } catch (error) {
        console.error("Error updating employee:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default employeeRouter;
