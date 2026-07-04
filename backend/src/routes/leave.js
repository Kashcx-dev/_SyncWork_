import express from 'express';
import prisma from '../../database/db.js';
import sendEmail from '../../helper/mailer.js';

const leaveRouter = express.Router();

// POST /api/leaves/apply - Apply for a leave
leaveRouter.post('/apply', async (req, res) => {
    try {
        const currentUser = req.user;
        const { leaveType, startDate, endDate, remarks } = req.body;

        if (!leaveType || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Leave type, start date, and end date are required' });
        }

        // Map frontend leave type string to Prisma Enum
        let mappedType = 'PAID';
        if (leaveType.toUpperCase() === 'SICK') mappedType = 'SICK';
        if (leaveType.toUpperCase() === 'UNPAID') mappedType = 'UNPAID';

        const leave = await prisma.leaveRequest.create({
            data: {
                userId: currentUser.id,
                leaveType: mappedType,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                remarks: remarks || "",
                status: 'PENDING'
            }
        });

        res.status(201).json({ success: true, message: 'Leave request submitted', leave });
    } catch (error) {
        console.error("Error applying for leave:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/leaves - Get leaves (HR sees all, Employee sees own)
leaveRouter.get('/', async (req, res) => {
    try {
        const currentUser = req.user;
        
        let leaves = [];
        if (currentUser.role === 'HR' || currentUser.role === 'ADMIN') {
            leaves = await prisma.leaveRequest.findMany({
                include: { user: true },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            leaves = await prisma.leaveRequest.findMany({
                where: { userId: currentUser.id },
                include: { user: true },
                orderBy: { createdAt: 'desc' }
            });
        }

        // Map to frontend expected format
        const formattedLeaves = leaves.map(l => ({
            id: l.id,
            empId: l.user.employeeId,
            name: l.user.displayName,
            leaveType: l.leaveType === 'SICK' ? 'Sick' : l.leaveType === 'PAID' ? 'Paid' : 'Unpaid',
            startDate: l.startDate.toISOString().split('T')[0],
            endDate: l.endDate.toISOString().split('T')[0],
            remarks: l.remarks,
            status: l.status === 'PENDING' ? 'Pending' : l.status === 'APPROVED' ? 'Approved' : 'Rejected',
            adminComment: l.adminComments || ""
        }));

        res.status(200).json({ success: true, leaves: formattedLeaves });
    } catch (error) {
        console.error("Error fetching leaves:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/leaves/:leaveId/status - Update leave status (HR/Admin only)
leaveRouter.put('/:leaveId/status', async (req, res) => {
    try {
        const currentUser = req.user;
        if (currentUser.role !== 'HR' && currentUser.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const { leaveId } = req.params;
        const { status, adminComment } = req.body;

        if (!status || !['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveId },
            include: { user: true }
        });

        if (!leaveRequest) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        const updatedLeave = await prisma.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status: status.toUpperCase(),
                adminComments: adminComment || "",
                approvedById: currentUser.id
            }
        });

        // Send Email Notification
        const color = status === 'Approved' ? '#22c55e' : '#ef4444';
        const mailOptions = {
            from: '"SyncWork HR" <' + process.env.EMAIL_USER + '>',
            to: leaveRequest.user.email,
            subject: `Leave Request ${status}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333;">Leave Request Update</h2>
                    <p>Hello ${leaveRequest.user.displayName},</p>
                    <p>Your leave request from <strong>${leaveRequest.startDate.toDateString()}</strong> to <strong>${leaveRequest.endDate.toDateString()}</strong> has been reviewed.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 0; font-size: 16px;">Status: <strong style="color: ${color};">${status.toUpperCase()}</strong></p>
                    </div>

                    ${adminComment ? `<p><strong>HR Comments:</strong> "${adminComment}"</p>` : ''}

                    <p>If you have any questions, please reach out to your HR administrator.</p>
                    <br/>
                    <p>Best Regards,</p>
                    <p><strong>SyncWork HR Team</strong></p>
                </div>
            `
        };

        sendEmail(mailOptions).catch(console.error);

        res.status(200).json({ success: true, message: 'Leave status updated successfully' });
    } catch (error) {
        console.error("Error updating leave:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default leaveRouter;
