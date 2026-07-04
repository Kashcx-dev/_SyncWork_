import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export default function AdminLeaves() {
    const { leaves, processLeaveAction } = useContext(AppContext);

    const handleAction = (leaveId, status) => {
        const comment = prompt("Enter HR / Admin comments for this leave request:");
        processLeaveAction(leaveId, status, comment);
    };

    return (
        <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Leave Application Approvals</h2>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50">
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Emp ID</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Name</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Leave Type</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Dates</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Employee Remarks</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Status</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...leaves].reverse().map((leave) => {
                            let badgeClass = "bg-neutral-50 text-neutral-500 border border-neutral-205 dark:bg-neutral-950 dark:text-neutral-400 dark:border-neutral-850";
                            if (leave.status === "Rejected") badgeClass = "bg-neutral-950 text-white border border-neutral-800 dark:bg-neutral-800 dark:text-neutral-250 dark:border-neutral-650";
                            if (leave.status === "Approved") badgeClass = "bg-neutral-100 text-neutral-850 border border-neutral-300 dark:bg-neutral-900 dark:text-white dark:border-neutral-750";

                            return (
                                <tr key={leave.id} className="border-b border-slate-100 dark:border-neutral-800/40 hover:bg-slate-50/50 dark:hover:bg-neutral-800/20">
                                    <td className="p-4 text-sm font-semibold text-slate-800 dark:text-neutral-200">{leave.empId}</td>
                                    <td className="p-4 text-sm text-slate-850 dark:text-neutral-300 font-medium">{leave.name}</td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">{leave.leaveType}</td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">{leave.startDate} to {leave.endDate}</td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">{leave.remarks || '-'}</td>
                                    <td className="p-4 text-sm">
                                        <span className={`inline-block px-2.5 py-0.5 text-xs font-bold uppercase rounded-full ${badgeClass}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {leave.status === "Pending" ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(leave.id, 'Approved')}
                                                    className="px-3 py-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(leave.id, 'Rejected')}
                                                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-xs font-semibold shadow-sm border border-neutral-750 cursor-pointer"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 dark:text-neutral-500 font-semibold">Processed</span>
                                        )}
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
