'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const SHIFT_TYPES = {
    'M': { label: 'Mañana', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    'T': { label: 'Tarde', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    'N': { label: 'Noche', color: 'bg-indigo-900 text-white border-indigo-700' },
    'L': { label: 'Libre', color: 'bg-green-100 text-green-800 border-green-300' },
    '': { label: '-', color: 'bg-gray-50' }
};

export default function ShiftGrid() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [empRes, shiftRes] = await Promise.all([
                fetch('/api/employees'),
                fetch(`/api/shifts?month=${format(currentDate, 'yyyy-MM')}`)
            ]);
            const empData = await empRes.json();
            const shiftData = await shiftRes.json();

            setEmployees(empData || []);
            setShifts(shiftData || []);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const getShift = (employeeId, date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return shifts.find(s => s.employeeId === employeeId && s.date === dateStr)?.type || '';
    };

    const handleCellClick = (employeeId, date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const currentType = getShift(employeeId, date);

        // Cycle through types: '' -> M -> T -> N -> L -> ''
        const types = ['', 'M', 'T', 'N', 'L'];
        const nextIndex = (types.indexOf(currentType) + 1) % types.length;
        const nextType = types[nextIndex];

        // Optimistic update
        setShifts(prev => {
            const filtered = prev.filter(s => !(s.employeeId === employeeId && s.date === dateStr));
            if (nextType) {
                return [...filtered, { employeeId, date: dateStr, type: nextType }];
            }
            return filtered;
        });
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            await fetch('/api/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shifts })
            });
            // Verification?
        } catch (err) {
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-cookie-light">
            {/* Controls */}
            <div className="p-4 flex justify-between items-center bg-cookie-cream border-b border-cookie-light">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-cookie-dark capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white rounded"><ChevronLeft /></button>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white rounded"><ChevronRight /></button>
                    </div>
                </div>
                <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="bg-cookie-brand text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-cookie-dark disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                    Guardar Cambios
                </button>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 text-left min-w-[150px] sticky left-0 bg-cookie-cream z-10 border-b border-r border-cookie-light">Empleado</th>
                            {daysInMonth.map(day => (
                                <th key={day.toString()} className="p-1 min-w-[40px] text-center text-xs font-normal border-b border-cookie-light">
                                    <div className="font-bold">{format(day, 'd')}</div>
                                    <div className="text-gray-500">{format(day, 'EEEEE', { locale: es })}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-50">
                                <td className="p-2 border-r border-cookie-light sticky left-0 bg-white font-medium text-sm truncate max-w-[150px]">
                                    {emp.name}
                                    <div className="text-xs text-gray-400">{emp.code}</div>
                                </td>
                                {daysInMonth.map(day => {
                                    const type = getShift(emp.id, day);
                                    const style = SHIFT_TYPES[type] || SHIFT_TYPES[''];
                                    return (
                                        <td
                                            key={day.toString()}
                                            onClick={() => handleCellClick(emp.id, day)}
                                            className="p-1 text-center cursor-pointer border border-gray-100 hover:brightness-95 transition-all"
                                        >
                                            <div className={`w-8 h-8 mx-auto rounded-md flex items-center justify-center text-xs font-bold border ${style.color}`}>
                                                {type}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-50 flex gap-4 text-sm border-t border-cookie-light">
                {Object.entries(SHIFT_TYPES).filter(([k]) => k).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border ${val.color}`}></div>
                        <span>{val.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
