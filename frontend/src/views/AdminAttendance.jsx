import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function AdminAttendance() {
    const { attendance, employees } = useContext(AppContext);

    return (
        <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">All Employees Attendance Log</h2>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50">
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Date</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Emp ID</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Name</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Check In</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Check Out</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...attendance].reverse().map((log, idx) => {
                            const emp = employees.find(e => e.empId === log.empId) || { name: "Unknown" };
                            let badgeClass = "bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-neutral-900 dark:text-white dark:border-neutral-750";
                            if (log.status === "Absent") badgeClass = "bg-neutral-950 text-white border border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-650";
                            if (log.status === "Leave") badgeClass = "bg-neutral-50 text-neutral-500 border border-neutral-205 dark:bg-neutral-950 dark:text-neutral-400 dark:border-neutral-850";
                            if (log.status === "Half-day") badgeClass = "bg-neutral-200 text-neutral-700 border border-neutral-400 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700";

                            return (
                                <tr key={idx} className="border-b border-slate-100 dark:border-neutral-800/40 hover:bg-slate-50/50 dark:hover:bg-neutral-800/20">
                                    <td className="p-4 text-sm font-semibold text-slate-800 dark:text-neutral-200">{log.date}</td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-neutral-450">{log.empId}</td>
                                    <td className="p-4 text-sm text-slate-800 dark:text-neutral-300 font-medium">{emp.name}</td>
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
    );
}
