import React, { createContext, useState, useEffect } from 'react';
import { initCryptoEngine, generateRandomPrivateKey, getPublicKey, encryptPrivateKeyForVault, decryptPrivateKeyFromVault } from '../utils/crypto';
import { socket } from '../socket';

export const AppContext = createContext();

const INITIAL_EMPLOYEES = [
    {
        empId: "EMP001",
        name: "Sarah Jenkins",
        email: "hr@company.com",
        role: "HR",
        password: "Password123!",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
        phone: "+1 (555) 019-2834",
        address: "742 Evergreen Terrace, Springfield",
        title: "HR Director",
        department: "Human Resources",
        salary: {
            base: 6500,
            allowances: 800,
            deductions: 450
        }
    },
    {
        empId: "EMP002",
        name: "David Chen",
        email: "david@company.com",
        role: "Employee",
        password: "Password123!",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
        phone: "+1 (555) 014-9988",
        address: "128 Baker Street, London",
        title: "Software Engineer",
        department: "Engineering",
        salary: {
            base: 5500,
            allowances: 500,
            deductions: 350
        }
    },
    {
        empId: "EMP003",
        name: "Elena Rostova",
        email: "elena@company.com",
        role: "Employee",
        password: "Password123!",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120",
        phone: "+1 (555) 017-3344",
        address: "42 Wallaby Way, Sydney",
        title: "UX Designer",
        department: "Design",
        salary: {
            base: 5200,
            allowances: 400,
            deductions: 300
        }
    }
];

const INITIAL_ATTENDANCE = [
    { date: "2026-07-01", empId: "EMP002", checkIn: "08:58", checkOut: "17:05", status: "Present" },
    { date: "2026-07-02", empId: "EMP002", checkIn: "09:05", checkOut: "17:15", status: "Present" },
    { date: "2026-07-03", empId: "EMP002", checkIn: "09:00", checkOut: "13:00", status: "Half-day" },
    { date: "2026-07-01", empId: "EMP003", checkIn: "08:45", checkOut: "17:00", status: "Present" },
    { date: "2026-07-02", empId: "EMP003", checkIn: "", checkOut: "", status: "Absent" }
];

const INITIAL_LEAVES = [
    {
        id: "L001",
        empId: "EMP003",
        name: "Elena Rostova",
        leaveType: "Sick",
        startDate: "2026-07-06",
        endDate: "2026-07-08",
        remarks: "Recovering from high flu",
        status: "Pending",
        adminComment: ""
    }
];

export const AppProvider = ({ children }) => {
    // Database States loaded from localStorage or seeded
    const [employees, setEmployees] = useState(() => {
        const stored = localStorage.getItem("hrms_react_employees");
        return stored ? JSON.parse(stored) : INITIAL_EMPLOYEES;
    });

    const [attendance, setAttendance] = useState(() => {
        const stored = localStorage.getItem("hrms_react_attendance");
        return stored ? JSON.parse(stored) : INITIAL_ATTENDANCE;
    });

    const [leaves, setLeaves] = useState(() => {
        const stored = localStorage.getItem("hrms_react_leaves");
        return stored ? JSON.parse(stored) : INITIAL_LEAVES;
    });

    // Session States
    const [currentUser, setCurrentUser] = useState(() => {
        const active = sessionStorage.getItem("hrms_react_active_user");
        return active ? JSON.parse(active) : null;
    });

    const [profile, setProfile] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [myPrivateKey, setMyPrivateKey] = useState(null);

    const handleFirstTimeCryptoSetup = async (password, tokenToUse) => {
        try {
            const token = tokenToUse || sessionStorage.getItem("hrms_react_token");
            if (!token) return null;

            const privateKey = generateRandomPrivateKey();
            const privateKeyStr = privateKey.toString();
            const publicKeyStr = getPublicKey(privateKey);
            const vault = await encryptPrivateKeyForVault(privateKeyStr, password);

            await fetch('http://localhost:3000/api/chat/vault', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    publicKey: publicKeyStr,
                    encryptedPrivateKey: vault.encrypted_private_key,
                    keySalt: vault.key_salt,
                    keyIv: vault.key_iv
                })
            });

            setMyPrivateKey(privateKey);
            return privateKey;
        } catch (err) {
            console.error("Crypto setup error:", err);
            return null;
        }
    };

    const handleLoginCryptoSetup = async (password, tokenToUse) => {
        try {
            const token = tokenToUse || sessionStorage.getItem("hrms_react_token");
            if (!token) return null;

            const res = await fetch('http://localhost:3000/api/chat/vault', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok && data.hasVault) {
                const privateKeyStr = await decryptPrivateKeyFromVault(data.vault, password);
                const privateKeyBigInt = BigInt(privateKeyStr);
                setMyPrivateKey(privateKeyBigInt);
                return privateKeyBigInt;
            } else {
                return await handleFirstTimeCryptoSetup(password, token);
            }
        } catch (err) {
            console.error("Crypto vault recovery error:", err);
            return null;
        }
    };

    useEffect(() => {
        const setupChat = async () => {
            const isWasmLoaded = await initCryptoEngine();
            const token = sessionStorage.getItem("hrms_react_token");
            if (isWasmLoaded && token) {
                socket.auth = { token };
                socket.connect();
            }
        };
        setupChat();
    }, [currentUser]);

    const fetchEmployees = async (tokenValue) => {
        try {
            const tokenToUse = tokenValue || sessionStorage.getItem("hrms_react_token");
            if (!tokenToUse) return;

            const res = await fetch("http://localhost:3000/api/employees", {
                headers: {
                    "Authorization": `Bearer ${tokenToUse}`
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setEmployees(data.employees);
            }
        } catch (error) {
            console.error("Error loading employees list:", error);
        }
    };

    const fetchLeaves = async (tokenValue) => {
        try {
            const tokenToUse = tokenValue || sessionStorage.getItem("hrms_react_token");
            if (!tokenToUse) return;

            const res = await fetch("http://localhost:3000/api/leaves", {
                headers: {
                    "Authorization": `Bearer ${tokenToUse}`
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setLeaves(data.leaves);
            }
        } catch (error) {
            console.error("Error loading leaves list:", error);
        }
    };

    const fetchProfileAndDashboard = async (tokenValue) => {
        try {
            const tokenToUse = tokenValue || sessionStorage.getItem("hrms_react_token");
            if (!tokenToUse) return;

            const profileRes = await fetch("http://localhost:3000/api/profile", {
                headers: {
                    "Authorization": `Bearer ${tokenToUse}`
                }
            });
            const profileData = await profileRes.json();
            if (profileRes.ok && profileData.success) {
                setProfile(profileData.profile);
                if (profileData.profile.role === 'HR' || profileData.profile.role === 'ADMIN') {
                    await fetchEmployees(tokenToUse);
                }
                await fetchLeaves(tokenToUse);
            }

            const dashRes = await fetch("http://localhost:3000/api/dashboard", {
                headers: {
                    "Authorization": `Bearer ${tokenToUse}`
                }
            });
            const dashData = await dashRes.json();
            if (dashRes.ok) {
                setDashboardData(dashData.data);
            }
        } catch (error) {
            console.error("Error loading profile or dashboard:", error);
        }
    };

    useEffect(() => {
        const existingToken = sessionStorage.getItem("hrms_react_token");
        if (existingToken) {
            fetchProfileAndDashboard(existingToken);
            fetchLeaves(existingToken);
        }
    }, []);

    const [activeView, setActiveView] = useState("dashboard");
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("hrms_react_theme") || "light";
    });

    // Sync state changes with localStorage
    useEffect(() => {
        localStorage.setItem("hrms_react_employees", JSON.stringify(employees));
    }, [employees]);

    useEffect(() => {
        localStorage.setItem("hrms_react_attendance", JSON.stringify(attendance));
    }, [attendance]);

    useEffect(() => {
        localStorage.setItem("hrms_react_leaves", JSON.stringify(leaves));
    }, [leaves]);

    // Handle HTML tag class for styling toggles
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("hrms_react_theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === "dark" ? "light" : "dark"));
    };

    const handleLogin = async (email, password) => {
        try {
            const res = await fetch("http://localhost:3000/api/auth/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ creds: email, password })
            });
            const data = await res.json();
            if (res.ok) {
                if (data.requires2FA) {
                    return { success: true, requires2FA: true, email: data.email };
                }
                const sessionUser = {
                    empId: data.user.employeeId,
                    name: data.user.displayName,
                    email: email,
                    role: data.user.role === 'HR' || data.user.role === 'ADMIN' ? 'HR' : 'Employee',
                    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
                    phone: "",
                    address: "",
                    title: data.user.role === 'HR' || data.user.role === 'ADMIN' ? 'HR Officer' : 'Associate',
                    department: data.user.role === 'HR' || data.user.role === 'ADMIN' ? 'Human Resources' : 'Operations',
                    salary: {
                        base: 4500,
                        allowances: 300,
                        deductions: 200
                    }
                };
                setCurrentUser(sessionUser);
                sessionStorage.setItem("hrms_react_active_user", JSON.stringify(sessionUser));
                sessionStorage.setItem("hrms_react_token", data.token);
                await fetchProfileAndDashboard(data.token);
                return { success: true };
            } else {
                return { success: false, error: data.message || "Sign in failed" };
            }
        } catch (err) {
            return { success: false, error: "Unable to connect to server" };
        }
    };

    const handleVerifySigninOtp = async (email, otp) => {
        try {
            const res = await fetch("http://localhost:3000/api/auth/verify-signin-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (res.ok) {
                const sessionUser = {
                    empId: data.user.employeeId,
                    name: data.user.displayName,
                    email: email,
                    role: data.user.role === 'HR' || data.user.role === 'ADMIN' ? 'HR' : 'Employee',
                    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
                    phone: "",
                    address: "",
                    title: data.user.role === 'HR' || data.user.role === 'ADMIN' ? 'HR Officer' : 'Associate',
                    department: data.user.role === 'HR' || data.user.role === 'ADMIN' ? 'Human Resources' : 'Operations',
                    salary: {
                        base: 4500,
                        allowances: 300,
                        deductions: 200
                    }
                };
                setCurrentUser(sessionUser);
                sessionStorage.setItem("hrms_react_active_user", JSON.stringify(sessionUser));
                sessionStorage.setItem("hrms_react_token", data.token);
                await fetchProfileAndDashboard(data.token);
                return { success: true };
            } else {
                return { success: false, error: data.message || "Verification failed" };
            }
        } catch (err) {
            return { success: false, error: "Unable to connect to server" };
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setMyPrivateKey(null);
        sessionStorage.removeItem("hrms_react_active_user");
        sessionStorage.removeItem("hrms_react_token");
        setActiveView("dashboard");
        socket.disconnect();
    };

    const handleSignUp = async (newEmp) => {
        try {
            const res = await fetch("http://localhost:3000/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: newEmp.name, email: newEmp.email, password: newEmp.password, role: newEmp.role, department: newEmp.department })
            });
            const data = await res.json();
            if (res.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.message || "Signup failed" };
            }
        } catch (err) {
            return { success: false, error: "Unable to connect to server" };
        }
    };

    const handleVerifyOtp = async (email, otp) => {
        try {
            const res = await fetch("http://localhost:3000/api/auth/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (res.ok) {
                const sessionUser = {
                    empId: data.user.employeeId,
                    name: data.user.displayName,
                    email: data.user.email,
                    role: data.user.role === 'HR' || data.user.role === 'ADMIN' ? 'HR' : 'Employee',
                    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
                    phone: "",
                    address: "",
                    title: data.user.role === 'HR' || data.user.role === 'ADMIN' ? 'HR Officer' : 'Associate',
                    department: data.user.role === 'HR' || data.user.role === 'ADMIN' ? 'Human Resources' : 'Operations',
                    salary: {
                        base: 4500,
                        allowances: 300,
                        deductions: 200
                    }
                };
                setCurrentUser(sessionUser);
                sessionStorage.setItem("hrms_react_active_user", JSON.stringify(sessionUser));
                sessionStorage.setItem("hrms_react_token", data.token);
                await fetchProfileAndDashboard(data.token);
                return { success: true };
            } else {
                return { success: false, error: data.message || "Verification failed" };
            }
        } catch (err) {
            return { success: false, error: "Unable to connect to server" };
        }
    };

    const updateProfile = (phone, address, avatar) => {
        setEmployees(prev => {
            const updated = prev.map(emp => {
                if (emp.empId === currentUser.empId) {
                    const next = { ...emp, phone, address, avatar: avatar || emp.avatar };
                    setCurrentUser(next);
                    sessionStorage.setItem("hrms_react_active_user", JSON.stringify(next));
                    return next;
                }
                return emp;
            });
            return updated;
        });
    };

    const updateEmployeeAdmin = async (empId, fields) => {
        try {
            const token = sessionStorage.getItem("hrms_react_token");
            if (!token) return;

            const res = await fetch(`http://localhost:3000/api/employees/${empId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(fields)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setEmployees(prev => {
                    const updated = prev.map(emp => {
                        if (emp.empId === empId) {
                            const next = { ...emp, ...fields };
                            if (currentUser && currentUser.empId === empId) {
                                                        setCurrentUser(next);
                                                        sessionStorage.setItem("hrms_react_active_user", JSON.stringify(next));
                            }
                            return next;
                        }
                        return emp;
                    });
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error updating employee admin details:", error);
        }
    };

    const clockIn = () => {
        const todayStr = new Date().toISOString().split("T")[0];
        const timeStr = new Date().toTimeString().split(" ")[0].slice(0, 5);

        const newLog = {
            date: todayStr,
            empId: currentUser.empId,
            checkIn: timeStr,
            checkOut: "",
            status: "Present"
        };

        setAttendance(prev => [...prev, newLog]);
    };

    const clockOut = () => {
        const todayStr = new Date().toISOString().split("T")[0];
        const timeStr = new Date().toTimeString().split(" ")[0].slice(0, 5);

        setAttendance(prev => {
            return prev.map(log => {
                if (log.date === todayStr && log.empId === currentUser.empId) {
                    return { ...log, checkOut: timeStr };
                }
                return log;
            });
        });
    };

    const applyLeave = async (type, startDate, endDate, remarks) => {
        try {
            const token = sessionStorage.getItem("hrms_react_token");
            if (!token) return;

            const res = await fetch("http://localhost:3000/api/leaves/apply", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ leaveType: type, startDate, endDate, remarks })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // Ensure the leave is properly formatted for the frontend
                const newLeave = {
                    id: data.leave.id,
                    empId: currentUser.empId,
                    name: currentUser.name,
                    leaveType: type,
                    startDate: data.leave.startDate.split('T')[0],
                    endDate: data.leave.endDate.split('T')[0],
                    remarks,
                    status: "Pending",
                    adminComment: ""
                };
                setLeaves(prev => [newLeave, ...prev]);
            }
        } catch (error) {
            console.error("Error applying leave:", error);
        }
    };

    const processLeaveAction = async (leaveId, status, comment) => {
        try {
            const token = sessionStorage.getItem("hrms_react_token");
            if (!token) return;

            const res = await fetch(`http://localhost:3000/api/leaves/${leaveId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status, adminComment: comment })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setLeaves(prev => {
                    return prev.map(leave => {
                        if (leave.id === leaveId) {
                            return { ...leave, status, adminComment: comment || "" };
                        }
                        return leave;
                    });
                });
            }
        } catch (error) {
            console.error("Error processing leave action:", error);
        }
    };

    const updateSalaryStructure = async (empId, base, allowances, deductions) => {
        try {
            const token = sessionStorage.getItem("hrms_react_token");
            if (!token) return;

            const res = await fetch(`http://localhost:3000/api/payroll/${empId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ base, allowances, deductions })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setEmployees(prev => {
                    return prev.map(emp => {
                        if (emp.empId === empId) {
                            return {
                                ...emp,
                                salary: { base, allowances, deductions }
                            };
                        }
                        return emp;
                    });
                });
            }
        } catch (error) {
            console.error("Error updating salary structure:", error);
        }
    };

    return (
        <AppContext.Provider value={{
            employees,
            attendance,
            leaves,
            currentUser,
            profile,
            dashboardData,
            activeView,
            theme,
            toggleTheme,
            setActiveView,
            handleLogin,
            handleVerifySigninOtp,
            handleLogout,
            handleSignUp,
            handleVerifyOtp,
            updateProfile,
            updateEmployeeAdmin,
            clockIn,
            clockOut,
            applyLeave,
            processLeaveAction,
            updateSalaryStructure,
            myPrivateKey,
            handleLoginCryptoSetup,
            handleFirstTimeCryptoSetup
        }}>
            {children}
        </AppContext.Provider>
    );
};
