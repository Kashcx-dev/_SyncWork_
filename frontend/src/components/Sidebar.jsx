import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, CalendarRange, MailCheck, Coins, Users, CalendarCheck2, MessageSquare } from 'lucide-react';
import noProfilePic from '../assets/no-profile-pic.png';

export default function Sidebar() {
    const { currentUser } = useContext(AppContext);
    const location = useLocation();

    if (!currentUser) return null;

    const isHR = currentUser.role === 'HR';

    const menuItems = isHR 
        ? [
            { id: 'dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
            { id: 'admin-employees', label: 'Employees', icon: Users },
            { id: 'admin-attendance', label: 'Attendance Log', icon: CalendarCheck2 },
            { id: 'admin-leaves', label: 'Leave Approvals', icon: MailCheck },
            { id: 'admin-payroll', label: 'Payroll Management', icon: Coins },
            { id: 'chat', label: 'Secure Chat', icon: MessageSquare }
          ]
        : [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'attendance', label: 'Attendance', icon: CalendarRange },
            { id: 'leave', label: 'Time-off requests', icon: MailCheck },
            { id: 'payroll', label: 'My Salary', icon: Coins },
            { id: 'chat', label: 'Secure Chat', icon: MessageSquare }
          ];

    return (
        <aside className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 h-fit transition-colors duration-200">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-200 dark:border-neutral-800 mb-5">
                <img 
                    src={currentUser.avatar || noProfilePic} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-black dark:border-white"
                />
                <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</h4>
                    <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{currentUser.empId}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-white dark:border dark:border-neutral-600">
                        {currentUser.role}
                    </span>
                </div>
            </div>

            <nav className="flex flex-col gap-1">
                {menuItems.map(item => {
                    const Icon = item.icon;
                    const itemPath = item.id === 'dashboard' ? '/' : '/' + item.id;
                    const isActive = location.pathname === itemPath;
                    return (
                        <Link
                            key={item.id}
                            to={itemPath}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-all cursor-pointer ${
                                isActive 
                                    ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white border-l-4 border-black dark:border-white pl-3'
                                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
