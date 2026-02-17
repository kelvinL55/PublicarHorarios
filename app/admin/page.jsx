'use client';

import { useState } from 'react';
import ShiftGrid from '@/components/ShiftGrid';
import EmployeeManager from '@/components/EmployeeManager';
import UserManagement from '@/components/UserManagement';
import BulkUpload from '@/components/BulkUpload';
import { LogOut, Calendar, Users, UploadCloud, PieChart } from 'lucide-react'; // PieChart as placeholder
import { useAuth } from '@/app/context/AuthContext';

export default function AdminPage() {
    const { logout, user } = useAuth();
    const [activeTab, setActiveTab] = useState('shifts'); // shifts, users, bulk
    const [refreshKey, setRefreshKey] = useState(0);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

    const handleRefresh = () => {
        setRefreshKey(old => old + 1);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-cookie-light shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cookie-brand text-white rounded-lg flex items-center justify-center font-bold text-xl font-serif">
                            GS
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-cookie-dark leading-none">Grupo Superior</h1>
                            <p className="text-xs text-cookie-medium">Panel de Administración</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="hidden md:inline text-sm text-gray-500">Hola, {user?.username}</span>
                        <button
                            onClick={logout}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-2"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('shifts')}
                        className={`flex items-center gap-2 pb-3 pt-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'shifts' ? 'border-cookie-brand text-cookie-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Calendar size={18} /> Gestión de Turnos
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 pb-3 pt-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-cookie-brand text-cookie-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={18} /> Usuarios y Accesos
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`flex items-center gap-2 pb-3 pt-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'bulk' ? 'border-cookie-brand text-cookie-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <UploadCloud size={18} /> Carga Masiva
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 py-8 space-y-8">

                {activeTab === 'shifts' && (
                    <div className="animate-in fade-in duration-300 space-y-8">
                        <ShiftGrid
                            key={refreshKey}
                            onAddEmployee={() => setIsEmployeeModalOpen(true)}
                        />
                        <EmployeeManager
                            isOpen={isEmployeeModalOpen}
                            onClose={() => setIsEmployeeModalOpen(false)}
                            onEmployeeAdded={handleRefresh}
                        />
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-in fade-in duration-300">
                        <UserManagement />
                    </div>
                )}

                {activeTab === 'bulk' && (
                    <div className="animate-in fade-in duration-300 max-w-2xl mx-auto">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-cookie-dark">Carga Masiva de Horarios</h2>
                            <p className="text-gray-600">Sube un archivo Excel para actualizar los turnos de múltiples empleados.</p>
                        </div>
                        <BulkUpload />

                        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                            <h4 className="font-bold flex items-center gap-2 mb-2"><PieChart size={16} /> Instrucciones Importantes</h4>
                            <ul className="list-disc pl-5 space-y-1 opacity-80">
                                <li>Usa la plantilla descargable ("Descargar Plantilla").</li>
                                <li>El <strong>Código</strong> del empleado debe coincidir exactamente con el registrado en el sistema.</li>
                                <li>Las fechas deben estar en formato <strong>YYYY-MM-DD</strong> en la cabecera de las columnas.</li>
                                <li>Códigos de Turno permitidos: <strong>M</strong> (Mañana), <strong>T</strong> (Tarde), <strong>N</strong> (Noche), <strong>L</strong> (Libre).</li>
                            </ul>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
