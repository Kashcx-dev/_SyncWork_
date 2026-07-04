import React, { createContext, useState, useEffect } from 'react';

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
        sessionStorage.removeItem("hrms_react_active_user");
        sessionStorage.removeItem("hrms_react_token");
        setActiveView("dashboard");
    };

    const handleSignUp = async (newEmp) => {
        try {
            const res = await fetch("http://localhost:3000/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: newEmp.name, email: newEmp.email, password: newEmp.password })
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

    const updateEmployeeAdmin = (empId, fields) => {
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

    const applyLeave = (type, startDate, endDate, remarks) => {
        const newLeave = {
            id: "L" + Date.now().toString().slice(-4),
            empId: currentUser.empId,
            name: currentUser.name,
            leaveType: type,
            startDate,
            endDate,
            remarks,
            status: "Pending",
            adminComment: ""
        };

        setLeaves(prev => [...prev, newLeave]);
    };

    const processLeaveAction = (leaveId, status, comment) => {
        setLeaves(prev => {
            return prev.map(leave => {
                if (leave.id === leaveId) {
                    const nextLeave = { ...leave, status, adminComment: comment || "" };
                    
                    // If approved, create daily attendance markers for the leave period
                    if (status === "Approved") {
                        const start = new Date(leave.startDate);
                        const end = new Date(leave.endDate);
                        const logsToAdd = [];

                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                            const dateStr = d.toISOString().split("T")[0];
                            logsToAdd.push({
                                date: dateStr,
                                empId: leave.empId,
                                checkIn: "",
                                checkOut: "",
                                status: "Leave"
                            });
                        }

                        // Add without duplicates
                        setAttendance(currAttendance => {
                            const filteredLogs = logsToAdd.filter(
                                fresh => !currAttendance.some(old => old.date === fresh.date && old.empId === fresh.empId)
                            );
                            return [...currAttendance, ...filteredLogs];
                        });
                    }

                    return nextLeave;
                }
                return leave;
            });
        });
    };

    const updateSalaryStructure = (empId, base, allowances, deductions) => {
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
    };

    return (
        <AppContext.Provider value={{
            employees,
            attendance,
            leaves,
            currentUser,
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
            updateSalaryStructure
        }}>
            {children}
        </AppContext.Provider>
    );
};
