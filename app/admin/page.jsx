'use client';

import { useState } from 'react';
import ShiftGrid from '@/components/ShiftGrid';
import EmployeeManager from '@/components/EmployeeManager';
import UserManagement from '@/components/UserManagement';
import BulkUpload from '@/components/BulkUpload';
import { LogOut, Calendar, Users, UploadCloud, PieChart } from 'lucide-react'; // PieChart as placeholder
import { useAuth } from '@/app/context/AuthContext';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import CollaboratorSelectionModal from '@/components/CollaboratorSelectionModal';

export default function AdminPage() {
    const { logout, user } = useAuth();
    const [activeTab, setActiveTab] = useState('shifts'); // shifts, users, bulk
    const [refreshKey, setRefreshKey] = useState(0);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
    const [viewingCollaborator, setViewingCollaborator] = useState(null); // { id, name, ... }

    const handleRefresh = () => {
        setRefreshKey(old => old + 1);
    };

    const handleCollaboratorSelect = (collaborator) => {
        setViewingCollaborator(collaborator);
        setIsCollaboratorModalOpen(false);
    };

    // If viewing as collaborator, show that view instead of admin dashboard
    if (viewingCollaborator) {
        return (
            <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
                {/* Simulated Collaborator View Header */}
                <div className="bg-cookie-brand text-white p-4 sticky top-0 z-30 shadow-md flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setViewingCollaborator(null)}
                            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
                        >
                            Volver al Admin
                        </button>
                        <div className="border-l border-white/20 pl-3">
                            <h2 className="font-bold text-sm leading-none opacity-80">Vista Previa</h2>
                            <p className="text-lg font-bold">{viewingCollaborator.name}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 max-w-md mx-auto mt-8">
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Calendario de {viewingCollaborator.name}</h2>
                        <p className="text-gray-500">Visualizando como empleado</p>
                    </div>
                    {/* Reusing WeeklyCalendar component */}
                    {/* We need to import WeeklyCalendar dynamically or ensure it is imported at top */}
                    <WeeklyCalendar employeeId={viewingCollaborator.id} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-cookie-light shadow-sm sticky top-0 z-30">
                <div className="max-w-full md:px-10  mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-cookie-brand text-white rounded-lg flex items-center justify-center font-bold text-lg md:text-xl font-serif">
                            GS
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg md:text-xl font-bold text-cookie-dark leading-none">Grupo Superior</h1>
                            <p className="text-[10px] md:text-xs text-cookie-medium">Panel de Administración</p>
                        </div>
                        <div className="sm:hidden">
                            <h1 className="text-base font-bold text-cookie-dark leading-none">G. Superior</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsCollaboratorModalOpen(true)}
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                        >
                            <Users size={16} /> Vista Colaborador
                        </button>

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
                <div className="max-w-full md:px-10 mx-auto px-4 flex gap-4 md:gap-6 overflow-x-auto scrollbar-none">
                    <button
                        onClick={() => setActiveTab('shifts')}
                        className={`flex items-center gap-1.5 md:gap-2 pb-2 md:pb-3 pt-2 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'shifts' ? 'border-cookie-brand text-cookie-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Calendar size={16} className="md:w-[18px] md:h-[18px]" /> Gestión de Turnos
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-1.5 md:gap-2 pb-2 md:pb-3 pt-2 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-cookie-brand text-cookie-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={16} className="md:w-[18px] md:h-[18px]" /> Usuarios y Accesos
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`flex items-center gap-1.5 md:gap-2 pb-2 md:pb-3 pt-2 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'bulk' ? 'border-cookie-brand text-cookie-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <UploadCloud size={16} className="md:w-[18px] md:h-[18px]" /> Carga Masiva
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-full md:px-10 w-full mx-auto p-2 md:p-4 py-4 md:py-8 space-y-4 md:space-y-8">

                {activeTab === 'shifts' && (
                    <div className="animate-in fade-in duration-300 space-y-8">
                        <div className="flex justify-end md:hidden">
                            <button
                                onClick={() => setIsCollaboratorModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium w-full justify-center"
                            >
                                <Users size={16} /> Vista Colaborador
                            </button>
                        </div>
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
                    <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
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

            <CollaboratorSelectionModal
                isOpen={isCollaboratorModalOpen}
                onClose={() => setIsCollaboratorModalOpen(false)}
                onSelect={handleCollaboratorSelect}
            />
        </div>
    );
}
