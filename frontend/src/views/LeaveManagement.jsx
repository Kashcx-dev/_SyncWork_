import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Calendar from '../components/Calendar';
import Modal from '../components/Modal';

export default function LeaveManagement() {
    const { currentUser, leaves, applyLeave } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form states
    const [leaveType, setLeaveType] = useState('Paid');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [remarks, setRemarks] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (startDate > endDate) {
            alert("Start date cannot be after end date.");
            return;
        }

        applyLeave(leaveType, startDate, endDate, remarks);
        setIsModalOpen(false);
        // Reset
        setLeaveType('Paid');
        setStartDate('');
        setEndDate('');
        setRemarks('');
    };

    const userLeaves = leaves.filter(l => l.empId === currentUser.empId);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Leave & Time-Off Management</h2>
                    <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Submit time-off requests and track monthly calendar markers</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                >
                    Apply for Leave
                </button>
            </div>

            {/* Calendar */}
            <Calendar />

            {/* History Table */}
            <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">My Leave Requests History</h3>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50">
                                <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Date Range</th>
                                <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Leave Type</th>
                                <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Remarks</th>
                                <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Admin Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...userLeaves].reverse().map((leave) => {
                                let badgeClass = "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-neutral-850 dark:text-neutral-300 dark:border-neutral-700";
                                if (leave.status === "Rejected") badgeClass = "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-neutral-950 dark:text-neutral-500 dark:border-neutral-800";
                                if (leave.status === "Approved") badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-neutral-900 dark:text-white dark:border-neutral-700";

                                return (
                                    <tr key={leave.id} className="border-b border-slate-100 dark:border-neutral-800/40 hover:bg-slate-50/50 dark:hover:bg-neutral-800/20">
                                        <td className="p-4 text-sm font-semibold text-slate-800 dark:text-neutral-200">{leave.startDate} to {leave.endDate}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">{leave.leaveType}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">{leave.remarks || '-'}</td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-0.5 text-xs font-bold uppercase rounded-full ${badgeClass}`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 dark:text-neutral-400">{leave.adminComment || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Leave">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            Leave Type
                        </label>
                        <select
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        >
                            <option value="Paid">Paid Leave</option>
                            <option value="Sick">Sick Leave</option>
                            <option value="Unpaid">Unpaid Leave</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            required
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            Remarks/Reason
                        </label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                            placeholder="Explain reason for time-off..."
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                    >
                        Submit Application
                    </button>
                </form>
            </Modal>
        </div>
    );
}
