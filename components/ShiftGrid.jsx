'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Save, Loader2, Settings, ChevronsLeft, ChevronsRight, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrentWorkPeriod, getWorkPeriodDates, navigateWorkPeriod, calculateWorkStatistics } from '@/lib/workPeriod';
import ScheduleConfigModal from './ScheduleConfigModal';

export default function ShiftGrid({ onAddEmployee }) {
    // Inicializar con el periodo laboral actual
    const initialPeriod = getCurrentWorkPeriod();
    const [displayMonth, setDisplayMonth] = useState(initialPeriod.displayMonth);
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [scheduleTypes, setScheduleTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // State for dropdown popover
    const [activeCell, setActiveCell] = useState(null); // { employeeId, date, rect }

    const scrollContainerRef = useRef(null);

    // Obtener fechas del periodo laboral (27 al 26)
    const periodDates = getWorkPeriodDates(displayMonth.getFullYear(), displayMonth.getMonth());

    useEffect(() => {
        fetchData();
        fetchScheduleTypes();
    }, [displayMonth]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeCell && !e.target.closest('.shift-dropdown')) {
                setActiveCell(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeCell]);

    const fetchScheduleTypes = async () => {
        try {
            const res = await fetch('/api/schedule-types');
            const data = await res.json();
            setScheduleTypes(data);
        } catch (err) {
            console.error("Error fetching schedule types:", err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Calcular fechas del periodo para el fetch
            const period = getCurrentWorkPeriod(displayMonth);
            const startStr = format(period.start, 'yyyy-MM-dd');
            const endStr = format(period.end, 'yyyy-MM-dd');

            const [empRes, shiftRes, userRes] = await Promise.all([
                fetch('/api/employees'),
                fetch(`/api/shifts?startDate=${startStr}&endDate=${endStr}`),
                fetch('/api/users')
            ]);
            const empData = await empRes.json();
            const shiftData = await shiftRes.json();
            const userData = await userRes.json();

            // Merge status from users to employees
            const mergedEmployees = (empData || []).map(emp => {
                const user = (userData || []).find(u => u.employeeCode === emp.code || u.employeeId === emp.id);
                return { ...emp, status: user?.status || 'Active' };
            });

            // Sort: Active first, then Inactive
            mergedEmployees.sort((a, b) => {
                if (a.status === b.status) return a.name.localeCompare(b.name);
                return a.status === 'Inactive' ? 1 : -1;
            });

            setEmployees(mergedEmployees);
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

    const getShiftStyle = (typeCode) => {
        if (typeCode === 'E') return 'bg-gray-200 text-gray-800 border-gray-400';
        const type = scheduleTypes.find(t => t.code === typeCode);
        return type ? type.color : 'bg-gray-50'; // Default gray
    };

    const handleCellClick = (e, employeeId, date) => {
        e.stopPropagation();

        // Check if employee is inactive
        const employee = employees.find(e => e.id === employeeId);
        // We will handle restriction in the dropdown render or here?
        // User said: "only allow me to assign... E". 
        // Let's open the dropdown but it will only show 'E' if inactive.

        const rect = e.currentTarget.getBoundingClientRect();
        setActiveCell({
            employeeId,
            date: format(date, 'yyyy-MM-dd'),
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            isInactive: employee?.status === 'Inactive'
        });
    };

    const handleSelectShift = (typeCode) => {
        if (!activeCell) return;

        const { employeeId, date } = activeCell;

        setShifts(prev => {
            const filtered = prev.filter(s => !(s.employeeId === employeeId && s.date === date));
            if (typeCode) {
                return [...filtered, { employeeId, date, type: typeCode }];
            }
            return filtered;
        });
        setActiveCell(null);
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

    const saveScheduleConfig = async (newTypes) => {
        try {
            const res = await fetch('/api/schedule-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTypes)
            });
            if (res.ok) {
                setScheduleTypes(newTypes);
            } else {
                alert("Error al guardar configuración");
            }
        } catch (err) {
            console.error("Error saving config:", err);
            alert("Error de conexión");
        }
    };

    const changeMonth = (direction) => {
        const newDisplayMonth = navigateWorkPeriod(displayMonth, direction);
        setDisplayMonth(newDisplayMonth);
    };

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            if (direction === 'start') {
                scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scrollContainerRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
            }
        }
    };

    if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-cookie-light relative">
            {/* Controls */}
            <div className="p-2 md:p-4 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 bg-cookie-cream border-b border-cookie-light">
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-bold text-cookie-dark capitalize flex items-center gap-2 truncate">
                            {format(displayMonth, 'MMMM yyyy', { locale: es })}
                            <span className="hidden xs:inline-block text-[10px] md:text-sm font-normal text-gray-500 bg-white px-1.5 md:px-2 py-0.5 rounded-full border border-gray-200">
                                {employees.length}
                            </span>
                        </h2>
                        <p className="text-[10px] md:text-xs text-gray-500">
                            {format(periodDates[0], 'd MMM', { locale: es })} - {format(periodDates[periodDates.length - 1], 'd MMM', { locale: es })}
                        </p>
                    </div>
                    <div className="flex gap-1 md:gap-2 shrink-0">
                        <button onClick={() => changeMonth(-1)} className="p-1 md:p-1.5 hover:bg-white rounded transition-colors"><ChevronLeft size={18} /></button>
                        <button onClick={() => changeMonth(1)} className="p-1 md:p-1.5 hover:bg-white rounded transition-colors"><ChevronRight size={18} /></button>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                    {onAddEmployee && (
                        <button
                            onClick={onAddEmployee}
                            className="flex-1 md:flex-none px-2 md:px-3 py-1.5 md:py-2 text-[11px] md:text-sm bg-white text-cookie-brand border border-cookie-brand hover:bg-cookie-brand hover:text-white flex items-center justify-center gap-1.5 md:gap-2 rounded-lg transition-all shadow-sm"
                        >
                            <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="md:inline">Empleado</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsConfigOpen(true)}
                        className="flex-1 md:flex-none px-2 md:px-3 py-1.5 md:py-2 text-[11px] md:text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1.5 md:gap-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="md:inline">Horarios</span>
                    </button>
                    <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="flex-1 md:flex-none bg-cookie-brand text-white px-2 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm rounded-lg flex items-center justify-center gap-1.5 md:gap-2 hover:bg-cookie-dark disabled:opacity-50 shadow-sm transition-all"
                    >
                        {saving ? <Loader2 className="animate-spin h-3.5 w-3.5 md:h-4 md:w-4" /> : <Save className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                        <span className="md:inline">Guardar</span>
                    </button>
                </div>
            </div>

            {/* Config Modal */}
            <ScheduleConfigModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                scheduleTypes={scheduleTypes}
                onSave={saveScheduleConfig}
            />

            {/* Grid Container with Sticky Scrollbar logic */}
            <div className="relative">
                {/* Scroll Controls */}
                <div className="absolute top-0 right-0 h-full flex flex-col justify-center pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Could add floating scroll buttons here purely for visual cue if needed */}
                </div>

                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto max-h-[500px] relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                >
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-20 bg-cookie-cream shadow-sm">
                            <tr>
                                <th className="p-2 text-center w-10 min-w-[40px] max-w-[40px] sticky left-0 z-30 bg-cookie-cream border-b border-r border-cookie-light">#</th>
                                <th className="p-2 text-left min-w-[200px] sticky left-10 z-30 bg-cookie-cream border-b border-r border-cookie-light shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="flex justify-between items-center">
                                        <span>Empleado</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => scroll('start')} title="Ir al inicio" className="p-1 hover:bg-gray-200 rounded text-gray-500"><ChevronsLeft className="w-4 h-4" /></button>
                                            <button onClick={() => scroll('end')} title="Ir al final" className="p-1 hover:bg-gray-200 rounded text-gray-500"><ChevronsRight className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </th>
                                {periodDates.map(day => (
                                    <th key={day.toString()} className="p-1 min-w-[44px] text-center text-xs font-normal border-b border-cookie-light bg-cookie-cream">
                                        <div className="font-bold">{format(day, 'd')}</div>
                                        <div className="text-gray-500 capitalize">{format(day, 'EEE', { locale: es })}</div>
                                    </th>
                                ))}
                                {/* Columnas de estadísticas */}
                                <th className="p-2 text-center text-xs font-semibold border-b border-l-2 border-cookie-light bg-gray-50 min-w-[60px]">Total<br />Días</th>
                                <th className="p-2 text-center text-xs font-semibold border-b border-cookie-light bg-gray-50 min-w-[60px]">Días<br />Lab.</th>
                                <th className="p-2 text-center text-xs font-semibold border-b border-cookie-light bg-gray-50 min-w-[60px]">Días<br />Trab.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp, index) => {
                                // Calcular estadísticas para este empleado
                                const employeeShifts = shifts.filter(s => s.employeeId === emp.id);
                                const stats = calculateWorkStatistics(employeeShifts, periodDates);
                                const isInactive = emp.status === 'Inactive';

                                return (
                                    <tr key={emp.id} className={`group transition-colors ${isInactive ? 'opacity-75 grayscale' : ''}`}>
                                        <td className={`p-2 text-center text-xs font-mono text-gray-400 sticky left-0 z-10 w-10 min-w-[40px] max-w-[40px] border-r border-cookie-light border-b border-gray-100 ${isInactive ? 'bg-gray-100' : 'bg-white group-hover:bg-gray-50'}`}>
                                            {index + 1}
                                        </td>
                                        <td className={`p-2 border-r border-cookie-light sticky left-10 z-10 font-medium text-sm border-b border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${isInactive ? 'bg-gray-100' : 'bg-white group-hover:bg-gray-50'}`}>
                                            <div className="truncate max-w-[180px] font-semibold text-gray-700">
                                                {emp.name}
                                                {isInactive && <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1 rounded border border-gray-300">EX</span>}
                                            </div>
                                            <div className="text-xs text-gray-400">{emp.code}</div>
                                        </td>
                                        {periodDates.map(day => {
                                            const typeCode = getShift(emp.id, day);
                                            const colorClass = getShiftStyle(typeCode);
                                            return (
                                                <td
                                                    key={day.toString()}
                                                    onClick={(e) => handleCellClick(e, emp.id, day)}
                                                    className="p-1 text-center cursor-pointer border border-gray-100 hover:bg-black/5 transition-all relative"
                                                >
                                                    <div className={`w-8 h-8 mx-auto rounded-md flex items-center justify-center text-xs font-bold border-2 shadow-sm ${colorClass} transition-transform hover:scale-105`}>
                                                        {typeCode}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        {/* Columnas de estadísticas */}
                                        <td className="p-2 text-center font-semibold border-l-2 border-cookie-light bg-gray-50 border-b text-sm">{stats.totalDays}</td>
                                        <td className="p-2 text-center font-semibold bg-blue-50 border-b border-blue-100 text-blue-800 text-sm">{stats.workableDays}</td>
                                        <td className="p-2 text-center font-semibold bg-green-50 border-b border-green-100 text-green-800 text-sm">{stats.workingDays}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dropdown Popover */}
            {activeCell && (
                <div
                    className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 grid grid-cols-2 gap-2 w-64 shift-dropdown animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: Math.min(activeCell.top + 5, window.innerHeight - 200), // Prevent going offscreen
                        left: Math.min(activeCell.left - 100, window.innerWidth - 260)
                    }}
                >
                    <button
                        onClick={() => handleSelectShift('')}
                        className="p-2 rounded hover:bg-gray-100 text-gray-500 text-sm font-medium border border-dashed border-gray-300 col-span-2 text-center"
                    >
                        Limpiar Turno
                    </button>

                    {activeCell.isInactive ? (
                        <button
                            onClick={() => handleSelectShift('E')}
                            className="p-2 rounded border text-left flex items-center gap-2 hover:brightness-95 transition-all bg-gray-200 text-gray-800 border-gray-400 col-span-2"
                        >
                            <span className="font-bold w-6 text-center">E</span>
                            <span className="text-xs truncate">Cesado (Ex-Empleado)</span>
                        </button>
                    ) : (
                        scheduleTypes.map((type, index) => (
                            <button
                                key={`${index}-${type.code}`}
                                onClick={() => handleSelectShift(type.code)}
                                className={`p-2 rounded border text-left flex items-center gap-2 hover:brightness-95 transition-all ${type.color}`}
                            >
                                <span className="font-bold w-6 text-center">{type.code}</span>
                                <span className="text-xs truncate">{type.label}</span>
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="p-4 bg-gray-50 flex flex-wrap gap-4 text-sm border-t border-cookie-light">
                {scheduleTypes.map(type => (
                    <div key={type.code} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold border ${type.color}`}>
                            {type.code}
                        </div>
                        <span className="text-gray-600">{type.label}</span>
                    </div>
                ))}
                <div className="flex items-center gap-2 opacity-75">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold border bg-gray-200 text-gray-800 border-gray-400">E</div>
                    <span className="text-gray-600">Cesado</span>
                </div>
            </div>
        </div>
    );
}
