'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Clock, Sun, Moon, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SHIFT_ICONS = {
    'M': { icon: Sun, label: 'Mañana', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
    'T': { icon: Sun, label: 'Tarde', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    'N': { icon: Moon, label: 'Noche', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
    'L': { icon: Coffee, label: 'Libre', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
};

export default function WeeklyCalendar({ employeeId }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);

    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    useEffect(() => {
        if (employeeId) fetchShifts();
    }, [employeeId, currentDate]);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            // Fetch all shifts for the month (simplified, ideally range based)
            const res = await fetch(`/api/shifts?month=${format(currentDate, 'yyyy-MM')}`);
            const data = await res.json();
            // Filter client side for this employee
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
        return shift ? SHIFT_ICONS[shift.type] : null;
    };

    const changeWeek = (dir) => {
        setCurrentDate(prev => dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-cookie-light max-w-md mx-auto">
            {/* Header */}
            <div className="bg-cookie-brand p-6 text-white text-center relative">
                <h2 className="text-xl font-bold capitalize">
                    {format(start, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex justify-between items-center mt-4">
                    <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><ChevronLeft /></button>
                    <span className="text-sm font-medium opacity-90">
                        {format(start, 'd MMM')} - {format(end, 'd MMM')}
                    </span>
                    <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><ChevronRight /></button>
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
                                const Icon = shift?.icon || Calendar;

                                return (
                                    <div
                                        key={day.toString()}
                                        className={`flex items-center p-4 rounded-xl border transition-all hover:scale-[1.02] ${shift ? shift.bg : 'bg-white border-gray-100'
                                            } ${isToday ? 'ring-2 ring-cookie-brand ring-offset-2' : ''}`}
                                    >
                                        {/* Date Column */}
                                        <div className="flex flex-col items-center justify-center w-14 border-r border-gray-200 pr-4 mr-4">
                                            <span className="text-xs text-gray-500 uppercase font-bold">
                                                {format(day, 'EEE', { locale: es })}
                                            </span>
                                            <span className={`text-xl font-bold ${isToday ? 'text-cookie-brand' : 'text-gray-700'}`}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>

                                        {/* Shift Info */}
                                        <div className="flex-1">
                                            {shift ? (
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className={`font-bold ${shift.color}`}>{shift.label}</p>
                                                        <p className="text-xs text-gray-500">Turno asignado</p>
                                                    </div>
                                                    <Icon className={`w-6 h-6 ${shift.color}`} />
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
