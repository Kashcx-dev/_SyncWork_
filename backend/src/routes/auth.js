import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../database/db.js';
import sendEmail from '../../helper/mailer.js';

const authRouter = Router();

const otpMap = new Map();

function validatePassword(password) {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;
  return true;
}

async function Hash_Pass(password) {
    const saltRounds = parseInt(process.env.CRYPT_SALT || "10");
    const salt = await bcrypt.genSalt(isNaN(saltRounds) ? 10 : saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

const getTimeAndDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const date = `${day}-${month}-${year}`;
    const time = `${hours}:${minutes}:${seconds}`;

    return `(${date}) - (${time})`;
}

// Sign Up Route (Step 1: Send OTP)
authRouter.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role} = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ message: 'Password does not meet complexity requirements' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; 

        // Store email mapping to otp and user details
        otpMap.set(email, { otp, expiresAt, name, password, role: role === 'HR' ? 'HR' : 'EMPLOYEE' });

        const options = {
            from: '"SyncWork" <master.trainer049@gmail.com>', // Ensure this matches your .env EMAIL_USER
            to: email,
            subject: "Welcome to SyncWork - Your OTP",
            text: `Your verification OTP is: ${otp}. It expires in 5 minutes.`,
            html: `<h3>Welcome to SyncWork!</h3><p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 5 minutes.</p>`
        };

        await sendEmail(options);

        return res.status(200).json({ 
            success: true, 
            message: `Verification OTP sent to ${email}.`,
            requires2FA: true 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Verify OTP Route (Step 2: Create User)
authRouter.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const storedData = otpMap.get(email);
        if (!storedData) {
            return res.status(400).json({ message: 'No OTP requested for this email or it expired.' });
        }

        if (Date.now() > storedData.expiresAt) {
            otpMap.delete(email); // Cleanup
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        if (storedData.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        const passwordHash = await Hash_Pass(storedData.password);
        
        const employeeId = `EMP-${crypto.randomInt(100000, 999999)}`;

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                displayName: storedData.name,
                employeeId,
                role: storedData.role || 'EMPLOYEE', // Use the role they selected during signup
                status: 'ACTIVE'
            }
        });

        otpMap.delete(email);

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({ 
            message: 'User created and logged in successfully',
            token,
            user: {
                id: user.id,
                employeeId: user.employeeId,
                displayName: user.displayName,
                email: user.email,
                createdAt: getTimeAndDate()
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Sign In Route
authRouter.post('/signin', async (req, res) => {
    try {
        const { creds, password } = req.body;

        if (!creds || !password) {
            return res.status(400).json({ message: 'Credentials and password are required' });
        }

        // Use findFirst when using OR operator in Prisma
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: creds },
                    { employeeId: creds }
                ]
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT Token for security
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({ 
            message: 'Signin successful', 
            token,
            user: {
                id: user.id,
                employeeId: user.employeeId,
                displayName: user.displayName,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default authRouter;