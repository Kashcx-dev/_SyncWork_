import React, { useContext } from "react";
import { AppContext } from "./context/AppContext";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Views
import Login from "./views/Login";
import Signup from "./views/Signup";
import DashboardOverview from "./views/DashboardOverview";
import Profile from "./views/Profile";
import Attendance from "./views/Attendance";
import LeaveManagement from "./views/LeaveManagement";
import Payroll from "./views/Payroll";
import AdminEmployees from "./views/AdminEmployees";
import AdminAttendance from "./views/AdminAttendance";
import AdminLeaves from "./views/AdminLeaves";
import AdminPayroll from "./views/AdminPayroll";

export default function App() {
	const { currentUser } = useContext(AppContext);

	if (!currentUser) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-black transition-colors duration-200">
				<Navbar />
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/signup" element={<Signup />} />
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-black transition-colors duration-200">
			<Navbar />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
					<Sidebar />
					<main className="space-y-6">
						<Routes>
							<Route path="/" element={<DashboardOverview />} />
							<Route path="/profile" element={<Profile />} />
							<Route path="/attendance" element={<Attendance />} />
							<Route path="/leave" element={<LeaveManagement />} />
							<Route path="/payroll" element={<Payroll />} />
							<Route
								path="/admin-employees"
								element={<AdminEmployees />}
							/>
							<Route
								path="/admin-attendance"
								element={<AdminAttendance />}
							/>
							<Route path="/admin-leaves" element={<AdminLeaves />} />
							<Route path="/admin-payroll" element={<AdminPayroll />} />
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</main>
				</div>
			</div>
		</div>
	);
}
