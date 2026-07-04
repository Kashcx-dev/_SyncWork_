import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

export default function Payroll() {
	const { currentUser } = useContext(AppContext);

	const salary = currentUser.salary || {
		base: 0,
		allowances: 0,
		deductions: 0,
	};
	const netPayable = salary.base + salary.allowances - salary.deductions;

	return (
		<div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-8 shadow-sm transition-all duration-200">
			<div className="pb-6 border-b border-slate-200 dark:border-neutral-800 mb-6">
				<h2 className="text-2xl font-bold text-slate-800 dark:text-white">
					My Payroll & Compensation
				</h2>
				<p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
					Read-only view of your official base structure details
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="bg-slate-50 dark:bg-neutral-950 p-6 rounded-xl border border-slate-100 dark:border-neutral-900">
					<label className="block text-[10px] font-bold text-slate-450 dark:text-neutral-500 uppercase tracking-wider mb-2">
						Base Salary
					</label>
					<p className="text-2xl font-extrabold text-slate-800 dark:text-neutral-200">
						${salary.base.toFixed(2)}
					</p>
				</div>

				<div className="bg-slate-50 dark:bg-neutral-950 p-6 rounded-xl border border-slate-100 dark:border-neutral-900">
					<label className="block text-[10px] font-bold text-slate-450 dark:text-neutral-500 uppercase tracking-wider mb-2">
						Allowances
					</label>
					<p className="text-2xl font-extrabold text-slate-800 dark:text-neutral-200">
						${salary.allowances.toFixed(2)}
					</p>
				</div>

				<div className="bg-slate-50 dark:bg-neutral-950 p-6 rounded-xl border border-slate-100 dark:border-neutral-900">
					<label className="block text-[10px] font-bold text-slate-450 dark:text-neutral-500 uppercase tracking-wider mb-2">
						Deductions
					</label>
					<p className="text-2xl font-extrabold text-slate-800 dark:text-neutral-250">
						${salary.deductions.toFixed(2)}
					</p>
				</div>

				<div className="bg-neutral-100 dark:bg-neutral-800/50 p-6 rounded-xl border border-neutral-300 dark:border-neutral-800">
					<label className="block text-[10px] font-bold text-neutral-800 dark:text-neutral-300 uppercase tracking-wider mb-2">
						Net Payable Salary
					</label>
					<p className="text-2xl font-extrabold text-black dark:text-white">
						${netPayable.toFixed(2)}
					</p>
				</div>
			</div>
		</div>
	);
}
