import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
    const { handleSignUp, handleVerifyOtp, handleFirstTimeCryptoSetup } = useContext(AppContext);
    const navigate = useNavigate();

    // Input states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    const [department, setDepartment] = useState('Operations');
    const [otp, setOtp] = useState('');
    
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateSignUp = () => {
        const temp = {};
        if (!name.trim()) temp.name = "Full name is required";
        if (!email.trim()) temp.email = "Email is required";
        if (!password) temp.password = "Password is required";
        setErrors(temp);
        return Object.keys(temp).length === 0;
    };

    const validateOtp = () => {
        const temp = {};
        if (!otp.trim()) temp.otp = "OTP is required";
        setErrors(temp);
        return Object.keys(temp).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!otpSent) {
            if (!validateSignUp()) return;
            setIsLoading(true);
            const res = await handleSignUp({ name, email, password, role, department });
            setIsLoading(false);
            if (res.success) {
                setOtpSent(true);
            } else {
                setErrors({ global: res.error });
            }
        } else {
            if (!validateOtp()) return;
            setIsLoading(true);
            const res = await handleVerifyOtp(email, otp);
            setIsLoading(false);
            if (res.success) {
                await handleFirstTimeCryptoSetup(password, sessionStorage.getItem("hrms_react_token"));
                navigate('/');
            } else {
                setErrors({ global: res.error });
            }
        }
    };

    return (
        <div className="min-h-[calc(100vh-73px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-10 shadow-xl transition-all duration-300">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {otpSent ? "Verify OTP" : "Register Account"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-neutral-400">
                        {otpSent ? `Enter the OTP sent to ${email}` : "Create your profile in HRMS Core"}
                    </p>
                </div>

                {errors.global && (
                    <div className="mb-4 p-4 text-sm bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl dark:bg-neutral-950 dark:text-rose-400 dark:border-neutral-800">
                        {errors.global}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {!otpSent ? (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                                />
                                {errors.name && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                                />
                                {errors.email && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                                    Register As (Role)
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-950 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                                >
                                    <option value="EMPLOYEE">Employee (Regular)</option>
                                    <option value="HR">HR / Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                                    Department
                                </label>
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-950 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                                >
                                    <option value="Operations">Operations</option>
                                    <option value="Human Resources">Human Resources</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Finance">Finance</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                                />
                                {errors.password && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 leading-relaxed">{errors.password}</p>}
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                                One-Time Password (OTP)
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-rose-400 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                            />
                            {errors.otp && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.otp}</p>}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {isLoading ? "Processing..." : (otpSent ? "Verify & Login" : "Sign Up")}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500 dark:text-neutral-400">
                    Already registered?{" "}
                    <Link to="/login" className="text-black dark:text-white font-bold hover:underline cursor-pointer">
                        Sign In here
                    </Link>
                </div>
            </div>
        </div>
    );
}
