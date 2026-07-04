import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
	User,
	CalendarRange,
	MailCheck,
	Coins,
	Users,
	CalendarCheck2,
} from "lucide-react";

export default function DashboardOverview() {
	const { currentUser, leaves, employees } = useContext(AppContext);
	const navigate = useNavigate();

	if (!currentUser) return null;

	const isHR = currentUser.role === "HR";
	const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;

	return (
		<div className="space-y-6">
			<div className="bg-linear-to-r from-slate-100 to-slate-200/50 dark:from-neutral-900 dark:to-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-2xl p-8 relative overflow-hidden transition-all">
				<h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-2">
					Good Day, {currentUser.name}!
				</h1>
				<p className="text-sm text-slate-600 dark:text-neutral-400">
					{isHR
						? "Here is the summary of HR tasks and employee logs today."
						: "Access your profile, record attendance, and apply for leaves."}
				</p>
			</div>

			{isHR ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					<div
						onClick={() => navigate("/admin-employees")}
						className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
					>
						<div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-105">
							<Users size={20} />
						</div>
						<h3 className="font-bold text-slate-800 dark:text-white text-base">
							Employee Directory
						</h3>
						<p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
							Manage {employees.length} active employee profiles
						</p>
					</div>

					<div
						onClick={() => navigate("/admin-attendance")}
						className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
					>
						<div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-105">
							<CalendarCheck2 size={20} />
						</div>
						<h3 className="font-bold text-slate-800 dark:text-white text-base">
							Attendance Tracker
						</h3>
						<p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
							Review check-in/out records
						</p>
					</div>

					<div
						onClick={() => navigate("/admin-leaves")}
						className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
					>
						<div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-105">
							<MailCheck size={20} />
						</div>
						<h3 className="font-bold text-slate-800 dark:text-white text-base">
							Leave Approvals
						</h3>
						<p className="text-xs text-neutral-800 dark:text-white font-bold underline mt-1">
							{pendingLeaves} applications require action
						</p>
					</div>

					<div
						onClick={() => navigate("/admin-payroll")}
						className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
					>
						<div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-105">
							<Coins size={20} />
						</div>
						<h3 className="font-bold text-slate-800 dark:text-white text-base">
							Payroll Control
						</h3>
						<p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
							Adjust compensation and base structures
						</p>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					<div
						onClick={() => navigate("/profile")}
						className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
					>
						<div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-105">
							<User size={20} />
						</div>
						<h3 className="font-bold text-slate-800 dark:text-white text-base">
							My Profile
						</h3>
						<p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
							View details and edit settings
						</p>
					</div>

					<div
						onClick={() => navigate("/attendance")}
						className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
					>
						<div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-105">
							<CalendarRange size={20} />
						</div>
						<h3 className="font-bold text-slate-800 dark:text-white text-base">
							Attendance Logs
						</h3>
						<p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
							Clock-in and check records
						</p>
					</div>

					<div
						onClick={() => navigate("/leave")}
						className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
					>
						<div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-105">
							<MailCheck size={20} />
						</div>
						<h3 className="font-bold text-slate-800 dark:text-white text-base">
							Apply for Leave
						</h3>
						<p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
							Request paid or sick leaves
						</p>
					</div>

					<div
						onClick={() => navigate("/payroll")}
						className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
					>
						<div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-105">
							<Coins size={20} />
						</div>
						<h3 className="font-bold text-slate-800 dark:text-white text-base">
							Salary Visibility
						</h3>
						<p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
							View breakdown and structure
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
