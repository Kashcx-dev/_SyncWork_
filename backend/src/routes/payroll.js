import express from 'express';
import prisma from '../../database/db.js';
import sendEmail from '../../helper/mailer.js';

const payrollRouter = express.Router();

// PUT /api/payroll/:empId - Update employee salary structure (HR/Admin only)
payrollRouter.put('/:empId', async (req, res) => {
    try {
        const currentUser = req.user;
        if (currentUser.role !== 'HR' && currentUser.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const { empId } = req.params;
        const { base, allowances, deductions } = req.body;

        if (!base || isNaN(base)) {
            return res.status(400).json({ success: false, message: 'Invalid base salary' });
        }

        const targetUser = await prisma.user.findUnique({
            where: { employeeId: empId },
            include: { profile: true }
        });

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Prevent HR from editing themselves or another HR's salary
        if (currentUser.role === 'HR' && (targetUser.role === 'HR' || targetUser.role === 'ADMIN')) {
            return res.status(403).json({ success: false, message: 'HR cannot adjust compensation for themselves or other administrative accounts' });
        }

        // Update the baseSalary in their EmployeeProfile
        await prisma.employeeProfile.upsert({
            where: { userId: targetUser.id },
            create: {
                userId: targetUser.id,
                baseSalary: Number(base)
            },
            update: {
                baseSalary: Number(base)
            }
        });

        // Send Email Notification
        const mailOptions = {
            from: '"SyncWork HR" <' + process.env.EMAIL_USER + '>',
            to: targetUser.email,
            subject: 'Your Salary Structure Has Been Updated',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333;">Salary Structure Update</h2>
                    <p>Hello ${targetUser.displayName},</p>
                    <p>Your compensation and salary structure has been updated by the HR department.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <ul style="list-style-type: none; padding-left: 0;">
                            <li><strong>New Base Salary:</strong> $${base}/month</li>
                            <li><strong>Allowances:</strong> $${allowances || (Number(base) * 0.1)}/month</li>
                            <li><strong>Deductions:</strong> $${deductions || 200}/month</li>
                        </ul>
                    </div>

                    <p>These changes will be reflected in your next payroll cycle.</p>
                    <p>If you have any questions regarding these changes, please contact the HR or Finance department.</p>
                    <br/>
                    <p>Best Regards,</p>
                    <p><strong>SyncWork HR & Finance Team</strong></p>
                </div>
            `
        };

        sendEmail(mailOptions).catch(console.error);

        res.status(200).json({ success: true, message: 'Salary structure updated successfully' });
    } catch (error) {
        console.error("Error updating payroll:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default payrollRouter;
