import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
    const { handleLogin, handleVerifySigninOtp } = useContext(AppContext);
    const navigate = useNavigate();

    const [creds, setCreds] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    const [otpSent, setOtpSent] = useState(false);
    const [resolvedEmail, setResolvedEmail] = useState('');
    const [errors, setErrors] = useState({});

    const validateSignIn = () => {
        const temp = {};
        if (!creds.trim()) temp.creds = "Email or Employee ID is required";
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
            if (!validateSignIn()) return;
            const res = await handleLogin(creds, password);
            if (res.success) {
                if (res.requires2FA) {
                    setOtpSent(true);
                    setResolvedEmail(res.email);
                } else {
                    navigate('/');
                }
            } else {
                setErrors({ global: res.error });
            }
        } else {
            if (!validateOtp()) return;
            const res = await handleVerifySigninOtp(resolvedEmail, otp);
            if (res.success) {
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
                        {otpSent ? "Verify OTP" : "Welcome Back"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-neutral-400">
                        {otpSent ? `Enter the OTP sent to ${resolvedEmail}` : "Sign in to access your portal"}
                    </p>
                </div>

                {errors.global && (
                    <div className="mb-4 p-4 text-sm bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl dark:bg-neutral-950 dark:text-white dark:border-neutral-800">
                        {errors.global}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {!otpSent ? (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                                    Email or Employee ID
                                </label>
                                <input
                                    type="text"
                                    value={creds}
                                    onChange={(e) => setCreds(e.target.value)}
                                    placeholder="name@company.com or EMP-123456"
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                                />
                                {errors.creds && <p className="mt-1 text-xs text-rose-600 dark:text-white">{errors.creds}</p>}
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
                                {errors.password && <p className="mt-1 text-xs text-rose-600 dark:text-white">{errors.password}</p>}
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
                                className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                            />
                            {errors.otp && <p className="mt-1 text-xs text-rose-600 dark:text-white">{errors.otp}</p>}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                    >
                        {otpSent ? "Verify & Login" : "Sign In"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500 dark:text-neutral-400">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-black dark:text-white font-bold hover:underline cursor-pointer">
                        Register here
                    </Link>
                </div>
            </div>
        </div>
    );
}
