'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrentWorkPeriod, getWorkPeriodDates, navigateWorkPeriod, calculateWorkStatistics } from '@/lib/workPeriod';

const SHIFT_TYPES = {
    'M': { label: 'Mañana', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    'T': { label: 'Tarde', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    'N': { label: 'Noche', color: 'bg-indigo-900 text-white border-indigo-700' },
    'L': { label: 'Libre', color: 'bg-green-100 text-green-800 border-green-300' },
    '': { label: '-', color: 'bg-gray-50' }
};

export default function ShiftGrid() {
    // Inicializar con el periodo laboral actual
    const initialPeriod = getCurrentWorkPeriod();
    const [displayMonth, setDisplayMonth] = useState(initialPeriod.displayMonth);
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Obtener fechas del periodo laboral (27 al 26)
    const periodDates = getWorkPeriodDates(displayMonth.getFullYear(), displayMonth.getMonth());

    useEffect(() => {
        fetchData();
    }, [displayMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Calcular fechas del periodo para el fetch
            const period = getCurrentWorkPeriod(displayMonth);
            const startStr = format(period.start, 'yyyy-MM-dd');
            const endStr = format(period.end, 'yyyy-MM-dd');

            const [empRes, shiftRes] = await Promise.all([
                fetch('/api/employees'),
                fetch(`/api/shifts?startDate=${startStr}&endDate=${endStr}`)
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

    const changeMonth = (direction) => {
        const newDisplayMonth = navigateWorkPeriod(displayMonth, direction);
        setDisplayMonth(newDisplayMonth);
    };

    if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-cookie-light">
            {/* Controls */}
            <div className="p-4 flex justify-between items-center bg-cookie-cream border-b border-cookie-light">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-cookie-dark capitalize">
                            {format(displayMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                        <p className="text-xs text-gray-500">
                            Del {format(periodDates[0], 'd MMM', { locale: es })} al {format(periodDates[periodDates.length - 1], 'd MMM', { locale: es })}
                        </p>
                    </div>
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
                            {periodDates.map(day => (
                                <th key={day.toString()} className="p-1 min-w-[40px] text-center text-xs font-normal border-b border-cookie-light">
                                    <div className="font-bold">{format(day, 'd')}</div>
                                    <div className="text-gray-500">{format(day, 'EEEEE', { locale: es })}</div>
                                </th>
                            ))}
                            {/* Columnas de estadísticas */}
                            <th className="p-2 text-center text-xs font-semibold border-b border-l-2 border-cookie-light bg-gray-50">Total<br />Días</th>
                            <th className="p-2 text-center text-xs font-semibold border-b border-cookie-light bg-gray-50">Días<br />Lab.</th>
                            <th className="p-2 text-center text-xs font-semibold border-b border-cookie-light bg-gray-50">Días<br />Trab.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => {
                            // Calcular estadísticas para este empleado
                            const employeeShifts = shifts.filter(s => s.employeeId === emp.id);
                            const stats = calculateWorkStatistics(employeeShifts, periodDates);

                            return (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="p-2 border-r border-cookie-light sticky left-0 bg-white font-medium text-sm truncate max-w-[150px]">
                                        {emp.name}
                                        <div className="text-xs text-gray-400">{emp.code}</div>
                                    </td>
                                    {periodDates.map(day => {
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
                                    {/* Columnas de estadísticas */}
                                    <td className="p-2 text-center font-semibold border-l-2 border-cookie-light bg-gray-50">{stats.totalDays}</td>
                                    <td className="p-2 text-center font-semibold bg-blue-50">{stats.workableDays}</td>
                                    <td className="p-2 text-center font-semibold bg-green-50">{stats.workingDays}</td>
                                </tr>
                            );
                        })}
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
