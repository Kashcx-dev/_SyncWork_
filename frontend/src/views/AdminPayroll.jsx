import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Modal from '../components/Modal';

export default function AdminPayroll() {
    const { employees, updateSalaryStructure } = useContext(AppContext);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit compensation states
    const [base, setBase] = useState(0);
    const [allowances, setAllowances] = useState(0);
    const [deductions, setDeductions] = useState(0);

    const handleEditClick = (emp) => {
        setSelectedEmp(emp);
        const sal = emp.salary || { base: 0, allowances: 0, deductions: 0 };
        setBase(sal.base);
        setAllowances(sal.allowances);
        setDeductions(sal.deductions);
        setIsModalOpen(true);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        updateSalaryStructure(selectedEmp.empId, parseFloat(base), parseFloat(allowances), parseFloat(deductions));
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Payroll & Compensation Structures</h2>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50">
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Emp ID</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Name</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Base Salary</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Allowances</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Deductions</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Net Salary</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => {
                            const sal = emp.salary || { base: 0, allowances: 0, deductions: 0 };
                            const net = sal.base + sal.allowances - sal.deductions;

                            return (
                                <tr key={emp.empId} className="border-b border-slate-100 dark:border-neutral-800/40 hover:bg-slate-50/50 dark:hover:bg-neutral-800/20">
                                    <td className="p-4 text-sm font-semibold text-slate-800 dark:text-neutral-200">{emp.empId}</td>
                                    <td className="p-4 text-sm text-slate-850 dark:text-neutral-300 font-medium">{emp.name}</td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">${sal.base.toFixed(2)}</td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">${sal.allowances.toFixed(2)}</td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">${sal.deductions.toFixed(2)}</td>
                                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">${net.toFixed(2)}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => handleEditClick(emp)}
                                            className="px-3.5 py-1.5 border border-slate-200 dark:border-neutral-850 bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-neutral-800 text-slate-800 dark:text-white rounded-lg text-xs font-bold cursor-pointer"
                                        >
                                            Adjust Compensation
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Adjust Salary: ${selectedEmp?.name}`}>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Base Salary</label>
                        <input
                            type="number"
                            required
                            value={base}
                            onChange={(e) => setBase(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Allowances</label>
                        <input
                            type="number"
                            required
                            value={allowances}
                            onChange={(e) => setAllowances(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Deductions</label>
                        <input
                            type="number"
                            required
                            value={deductions}
                            onChange={(e) => setDeductions(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                    >
                        Update Salary Structure
                    </button>
                </form>
            </Modal>
        </div>
    );
}
