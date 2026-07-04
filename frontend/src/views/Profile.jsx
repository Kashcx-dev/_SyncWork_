import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import Modal from "../components/Modal";

export default function Profile() {
	const { currentUser, updateProfile } = useContext(AppContext);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [phone, setPhone] = useState(currentUser.phone || "");
	const [address, setAddress] = useState(currentUser.address || "");
	const [avatar, setAvatar] = useState(currentUser.avatar || "");

	const handleSave = (e) => {
		e.preventDefault();
		updateProfile(phone, address, avatar);
		setIsModalOpen(false);
	};

	return (
		<div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-8 shadow-sm transition-all duration-200">
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-6 border-b border-slate-200 dark:border-neutral-800 mb-6 gap-4">
				<div>
					<h2 className="text-2xl font-bold text-slate-800 dark:text-white">
						My Profile
					</h2>
					<p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
						Review and manage your personal database records
					</p>
				</div>
				<button
					onClick={() => {
						setPhone(currentUser.phone || "");
						setAddress(currentUser.address || "");
						setAvatar(currentUser.avatar || "");
						setIsModalOpen(true);
					}}
					className="px-5 py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md self-start sm:self-center cursor-pointer"
				>
					Edit Personal Details
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-10">
				<div className="flex flex-col items-center gap-3">
					<img
						src={
							currentUser.avatar ||
							"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
						}
						alt="Avatar"
						className="w-36 h-36 rounded-full object-cover border-4 border-slate-100 dark:border-neutral-800 shadow"
					/>
					<span className="font-bold text-slate-800 dark:text-white mt-1 text-center">
						{currentUser.name}
					</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
					<div className="border-b border-slate-50 dark:border-neutral-800/40 pb-3">
						<label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
							Employee ID
						</label>
						<p className="text-base font-semibold text-slate-800 dark:text-neutral-200">
							{currentUser.empId}
						</p>
					</div>

					<div className="border-b border-slate-50 dark:border-neutral-800/40 pb-3">
						<label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
							Email Address
						</label>
						<p className="text-base font-semibold text-slate-800 dark:text-neutral-200">
							{currentUser.email}
						</p>
					</div>

					<div className="border-b border-slate-50 dark:border-neutral-800/40 pb-3">
						<label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
							Job Title
						</label>
						<p className="text-base font-semibold text-slate-800 dark:text-neutral-200">
							{currentUser.title || "N/A"}
						</p>
					</div>

					<div className="border-b border-slate-50 dark:border-neutral-800/40 pb-3">
						<label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
							Department
						</label>
						<p className="text-base font-semibold text-slate-800 dark:text-neutral-200">
							{currentUser.department || "N/A"}
						</p>
					</div>

					<div className="border-b border-slate-50 dark:border-neutral-800/40 pb-3">
						<label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
							Phone Number
						</label>
						<p className="text-base font-semibold text-slate-800 dark:text-neutral-200">
							{currentUser.phone || "Not Specified"}
						</p>
					</div>

					<div className="border-b border-slate-50 dark:border-neutral-800/40 pb-3">
						<label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
							Residential Address
						</label>
						<p className="text-base font-semibold text-slate-800 dark:text-neutral-200">
							{currentUser.address || "Not Specified"}
						</p>
					</div>

					<div className="border-b border-slate-50 dark:border-neutral-800/40 pb-3">
						<label className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
							Salary Grade
						</label>
						<p className="text-base font-semibold text-slate-800 dark:text-neutral-200">
							{currentUser.salary
								? `$${currentUser.salary.base}/month`
								: "Not Available"}
						</p>
					</div>
				</div>
			</div>

			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title="Edit Personal Details"
			>
				<form onSubmit={handleSave} className="space-y-4">
					<div>
						<label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
							Phone Number
						</label>
						<input
							type="text"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
						/>
					</div>
					<div>
						<label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
							Residential Address
						</label>
						<input
							type="text"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
						/>
					</div>
					<div>
						<label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
							Avatar Image URL
						</label>
						<input
							type="text"
							value={avatar}
							onChange={(e) => setAvatar(e.target.value)}
							className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
						/>
					</div>
					<button
						type="submit"
						className="w-full py-3 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
					>
						Save Changes
					</button>
				</form>
			</Modal>
		</div>
	);
}
