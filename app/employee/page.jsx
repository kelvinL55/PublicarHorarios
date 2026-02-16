'use client';

import WeeklyCalendar from '@/components/WeeklyCalendar';
import { useAuth } from '@/app/context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmployeePage() {
    const { user, logout } = useAuth();

    if (!user) return null;

    // Simulate linking user to employee record. 
    // In real app, user object would have employeeId.
    // We use user.employeeId from our mock DB.
    const employeeId = user.employeeId || 101;

    return (
        <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
            {/* Mobile Header */}
            <div className="bg-white p-4 sticky top-0 z-20 shadow-sm border-b border-cookie-light flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cookie-brand/10 flex items-center justify-center text-cookie-brand">
                        <User size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-cookie-dark leading-tight">Hola, {user.username}</h1>
                        <p className="text-xs text-gray-500">Operario</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                </button>
            </div>

            <main className="p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-cookie-dark mb-1">Tu Calendario</h2>
                        <p className="text-sm text-gray-500">Revisa tus turnos de la semana</p>
                    </div>

                    <WeeklyCalendar employeeId={employeeId} />
                </motion.div>
            </main>

            {/* Decorative background element */}
            <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cookie-brand/5 to-transparent pointer-events-none" />
        </div>
    );
}
