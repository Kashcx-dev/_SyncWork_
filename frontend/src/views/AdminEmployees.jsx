import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Modal from '../components/Modal';

export default function AdminEmployees() {
    const { employees, updateEmployeeAdmin } = useContext(AppContext);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Employee');
    const [title, setTitle] = useState('');
    const [dept, setDept] = useState('');

    const handleEditClick = (emp) => {
        setSelectedEmp(emp);
        setName(emp.name);
        setEmail(emp.email);
        setRole(emp.role);
        setTitle(emp.title || '');
        setDept(emp.department || '');
        setIsModalOpen(true);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        updateEmployeeAdmin(selectedEmp.empId, {
            name, email, role, title, department: dept
        });
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Employee Directory</h2>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50">
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Emp ID</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Name</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Email</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Role</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Title</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Department</th>
                            <th className="p-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.empId} className="border-b border-slate-100 dark:border-neutral-800/40 hover:bg-slate-50/50 dark:hover:bg-neutral-800/20">
                                <td className="p-4 text-sm font-semibold text-slate-800 dark:text-neutral-200">{emp.empId}</td>
                                <td className="p-4 text-sm text-slate-850 dark:text-neutral-300 font-medium">{emp.name}</td>
                                <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">{emp.email}</td>
                                <td className="p-4 text-sm text-slate-600 dark:text-neutral-450">{emp.role}</td>
                                <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">{emp.title || '-'}</td>
                                <td className="p-4 text-sm text-slate-600 dark:text-neutral-400">{emp.department || '-'}</td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => handleEditClick(emp)}
                                        className="px-3.5 py-1.5 border border-slate-200 dark:border-neutral-850 bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-neutral-800 text-slate-800 dark:text-white rounded-lg text-xs font-bold cursor-pointer"
                                    >
                                        Edit Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Edit Record: ${selectedEmp?.empId}`}>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        >
                            <option value="Employee">Employee</option>
                            <option value="HR">HR / Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Job Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Department</label>
                        <input
                            type="text"
                            value={dept}
                            onChange={(e) => setDept(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
                    >
                        Update Employee Details
                    </button>
                </form>
            </Modal>
        </div>
    );
}
