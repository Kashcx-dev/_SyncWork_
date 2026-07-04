import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function Attendance() {
    const { currentUser, attendance, clockIn, clockOut } = useContext(AppContext);

    const logs = attendance.filter(a => a.empId === currentUser.empId);
    const todayStr = new Date().toISOString().split("T")[0];
    const todayLog = logs.find(l => l.date === todayStr);

    const isClockedIn = todayLog && todayLog.checkIn && !todayLog.checkOut;
    const isShiftDone = todayLog && todayLog.checkIn && todayLog.checkOut;

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Daily Attendance Portal</h2>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-neutral-950 rounded-xl gap-4 border border-slate-100 dark:border-neutral-900">
                    <div className="flex gap-3">
                        <button 
                            disabled={todayLog}
                            onClick={clockIn}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer ${
                                todayLog 
                                    ? 'bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
                                    : 'bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black'
                            }`}
                        >
                            Clock In (Check In)
                        </button>
                        <button 
                            disabled={!isClockedIn}
                            onClick={clockOut}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer ${
                                !isClockedIn
                                    ? 'bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
                                    : 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-white border dark:border-neutral-600'
                            }`}
                        >
                            Clock Out (Check Out)
                        </button>
                    </div>

                    <div className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                        {isShiftDone ? (
                            <span className="text-slate-500 dark:text-neutral-400">Shift complete today ({todayLog.checkIn} - {todayLog.checkOut})</span>
                        ) : isClockedIn ? (
                            <span className="text-black dark:text-white font-bold">Active Shift (Started at {todayLog.checkIn})</span>
                        ) : (
                            <span className="text-slate-400 dark:text-neutral-500">Not Clocked In yet today</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">My Attendance Log History</h3>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50">
                                <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Date</th>
                                <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Check In Time</th>
                                <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Check Out Time</th>
                                <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...logs].reverse().map((log, idx) => {
                                let badgeClass = "bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-neutral-900 dark:text-white dark:border-neutral-750";
                                if (log.status === "Absent") badgeClass = "bg-neutral-950 text-white border border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-650";
                                if (log.status === "Leave") badgeClass = "bg-neutral-50 text-neutral-500 border border-neutral-200 dark:bg-neutral-950 dark:text-neutral-400 dark:border-neutral-850";
                                if (log.status === "Half-day") badgeClass = "bg-neutral-200 text-neutral-700 border border-neutral-400 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700";

                                return (
                                    <tr key={idx} className="border-b border-slate-100 dark:border-neutral-800/40 hover:bg-slate-50/50 dark:hover:bg-neutral-800/20">
                                        <td className="p-4 text-sm font-semibold text-slate-800 dark:text-neutral-200">{log.date}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">{log.checkIn || '-'}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">{log.checkOut || '-'}</td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-0.5 text-xs font-bold uppercase rounded-full ${badgeClass}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
