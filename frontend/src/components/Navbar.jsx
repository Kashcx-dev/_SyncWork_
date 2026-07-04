import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { Sun, Moon, LogOut } from "lucide-react";

export default function Navbar() {
	const { theme, toggleTheme, currentUser, handleLogout } =
		useContext(AppContext);

	return (
		<nav className="bg-white border-b border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50 transition-colors duration-200">
			<div className="flex items-center gap-2">
				{/* <div className="w-9 h-9 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center font-extrabold text-xl">
					S
				</div> */}
				<span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
					SyncWork
				</span>
			</div>

			<div className="flex items-center gap-4">
				<button
					onClick={toggleTheme}
					className="w-10 h-10 border border-slate-200 dark:border-neutral-800 rounded-full flex items-center justify-center text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
					aria-label="Toggle Theme"
				>
					{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
				</button>

				{currentUser && (
					<button
						onClick={handleLogout}
						className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
					>
						<LogOut size={16} />
						<span>Log Out</span>
					</button>
				)}
			</div>
		</nav>
	);
}
