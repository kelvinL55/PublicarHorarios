'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentWorkPeriod } from '@/lib/workPeriod';

// Mapea la clase de color de Tailwind a estilos para la vista de empleado
function deriveEmployeeStyle(tailwindColor = '') {
    if (tailwindColor.includes('yellow')) return { text: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' };
    if (tailwindColor.includes('orange')) return { text: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
    if (tailwindColor.includes('indigo')) return { text: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' };
    if (tailwindColor.includes('green')) return { text: 'text-green-600', bg: 'bg-green-50 border-green-200' };
    if (tailwindColor.includes('blue')) return { text: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
    if (tailwindColor.includes('red')) return { text: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    if (tailwindColor.includes('purple')) return { text: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' };
    if (tailwindColor.includes('pink')) return { text: 'text-pink-600', bg: 'bg-pink-50 border-pink-200' };
    return { text: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
}

export default function WeeklyCalendar({ employeeId }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState([]);
    const [scheduleTypes, setScheduleTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const start = startOfWeek(currentDate, { weekStartsOn: 6 });
    const end = endOfWeek(currentDate, { weekStartsOn: 6 });
    const days = eachDayOfInterval({ start, end });

    // Fetch schedule types once on mount
    useEffect(() => {
        fetch('/api/schedule-types')
            .then(r => r.json())
            .then(data => setScheduleTypes(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (employeeId) fetchShifts();
    }, [employeeId, currentDate]);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const period = getCurrentWorkPeriod(currentDate);
            const startStr = format(period.start, 'yyyy-MM-dd');
            const endStr = format(period.end, 'yyyy-MM-dd');

            const res = await fetch(`/api/shifts?startDate=${startStr}&endDate=${endStr}`);
            const data = await res.json();
            setShifts(data.filter(s => s.employeeId === employeeId));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getShiftForDay = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const shift = shifts.find(s => s.date === dateStr);
        if (!shift) return null;

        // Cesado special case
        if (shift.type === 'E') {
            return { label: 'Cesado', style: { text: 'text-gray-600', bg: 'bg-gray-100 border-gray-300' } };
        }

        // Dynamic lookup from admin-configured types
        const typeConfig = scheduleTypes.find(t => t.code === shift.type);
        if (typeConfig) {
            return { label: typeConfig.label, style: deriveEmployeeStyle(typeConfig.color) };
        }

        // Fallback: just show the code
        return { label: shift.type, style: { text: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' } };
    };

    const changeWeek = (dir) => {
        setCurrentDate(prev => dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-cookie-light max-w-md mx-auto">
            {/* Header */}
            <div className="bg-cookie-brand p-4 md:p-6 text-white text-center relative">
                <h2 className="text-lg md:text-xl font-bold capitalize">
                    {format(start, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex justify-between items-center mt-3 md:mt-4">
                    <button onClick={() => changeWeek(-1)} className="p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                    <span className="text-xs md:text-sm font-medium opacity-90">
                        {format(start, 'd MMM')} - {format(end, 'd MMM')}
                    </span>
                    <button onClick={() => changeWeek(1)} className="p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors"><ChevronRight size={20} /></button>
                </div>
            </div>

            {/* Week Grid */}
            <div className="p-4 space-y-3 bg-gray-50 min-h-[400px]">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Cargando horarios...</div>
                ) : (
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={format(start, 'yyyy-ww')}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-3"
                        >
                            {days.map((day) => {
                                const shift = getShiftForDay(day);
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div
                                        key={day.toString()}
                                        className={`flex items-center p-3 md:p-4 rounded-xl border transition-all hover:scale-[1.02] ${shift ? shift.style.bg : 'bg-white border-gray-100'
                                            } ${isToday ? 'ring-2 ring-cookie-brand ring-offset-2' : ''}`}
                                    >
                                        {/* Date Column */}
                                        <div className="flex flex-col items-center justify-center w-12 md:w-14 border-r border-gray-200 pr-3 md:pr-4 mr-3 md:mr-4">
                                            <span className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">
                                                {format(day, 'EEE', { locale: es })}
                                            </span>
                                            <span className={`text-lg md:text-xl font-bold ${isToday ? 'text-cookie-brand' : 'text-gray-700'}`}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>

                                        {/* Shift Info */}
                                        <div className="flex-1">
                                            {shift ? (
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className={`font-bold ${shift.style.text}`}>{shift.label}</p>
                                                        <p className="text-xs text-gray-500">Turno asignado</p>
                                                    </div>
                                                    <span className={`text-sm font-bold px-2 py-1 rounded-lg border ${shift.style.bg} ${shift.style.text}`}>
                                                        {shifts.find(s => s.date === format(day, 'yyyy-MM-dd'))?.type}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Clock size={16} />
                                                    <span className="text-sm">Sin asignar</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

