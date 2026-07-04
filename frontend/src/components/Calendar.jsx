import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar() {
    const { currentUser, attendance, leaves } = useContext(AppContext);
    const [currentDate, setCurrentDate] = useState(new Date("2026-07-04"));

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Filter user details
    const userLeaves = leaves.filter(l => l.empId === currentUser.empId && l.status === "Approved");
    const userAttendance = attendance.filter(a => a.empId === currentUser.empId);

    const changeMonth = (direction) => {
        const next = new Date(currentDate);
        next.setMonth(next.getMonth() + direction);
        setCurrentDate(next);
    };

    const firstDayIdx = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Create Calendar Cells
    const cells = [];
    // Previous month filler
    for (let i = 0; i < firstDayIdx; i++) {
        cells.push({ type: 'empty', key: `empty-${i}` });
    }
    // Days of month
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Find matching status
        const isLeave = userLeaves.some(l => dateStr >= l.startDate && dateStr <= l.endDate);
        const dayAtt = userAttendance.find(a => a.date === dateStr);

        let marker = null;
        if (isLeave) {
            marker = { label: 'Leave', style: 'bg-neutral-50 text-neutral-500 border border-neutral-200 dark:bg-neutral-950 dark:text-neutral-400 dark:border-neutral-850' };
        } else if (dayAtt) {
            if (dayAtt.status === 'Present') {
                marker = { label: 'Present', style: 'bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-neutral-900 dark:text-white dark:border-neutral-750' };
            } else if (dayAtt.status === 'Absent') {
                marker = { label: 'Absent', style: 'bg-neutral-950 text-white border border-neutral-850 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-650' };
            } else if (dayAtt.status === 'Half-day') {
                marker = { label: 'Half-day', style: 'bg-neutral-200 text-neutral-700 border border-neutral-400 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700' };
            }
        }

        cells.push({
            type: 'day',
            day,
            dateStr,
            marker,
            key: `day-${day}`
        });
    }

    return (
        <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    {monthNames[month]} {year}
                </h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => changeMonth(-1)}
                        className="p-2 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 cursor-pointer"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => changeMonth(1)}
                        className="p-2 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 cursor-pointer"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
                {daysOfWeek.map(d => (
                    <div key={d} className="text-xs font-bold text-slate-400 dark:text-neutral-500 py-2 uppercase">
                        {d}
                    </div>
                ))}

                {cells.map((cell, idx) => {
                    if (cell.type === 'empty') {
                        return <div key={cell.key} className="aspect-[1.2] opacity-30 bg-slate-50 dark:bg-neutral-950/20 border border-slate-100 dark:border-neutral-950 rounded-xl" />;
                    }
                    return (
                        <div 
                            key={cell.key} 
                            className="aspect-[1.2] border border-slate-100 dark:border-neutral-900 bg-slate-50/50 dark:bg-neutral-950/50 rounded-xl p-2 flex flex-col justify-between items-start transition-all hover:bg-slate-100/50 dark:hover:bg-neutral-900/50"
                        >
                            <span className="font-bold text-sm text-slate-800 dark:text-neutral-200">
                                {cell.day}
                            </span>
                            {cell.marker && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-full text-center truncate ${cell.marker.style}`}>
                                    {cell.marker.label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
