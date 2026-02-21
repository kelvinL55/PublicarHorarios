'use client';

import { useState, useEffect } from 'react';
import { X, Search, User, ChevronRight } from 'lucide-react';

export default function CollaboratorSelectionModal({ isOpen, onClose, onSelect }) {
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/employees');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Seleccionar Colaborador</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-cookie-brand outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {loading ? (
                            <div className="text-center py-8 text-gray-400">Cargando colaboradores...</div>
                        ) : filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                                <button
                                    key={emp.id}
                                    onClick={() => onSelect(emp)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-cookie-brand/5 rounded-lg border border-transparent hover:border-cookie-brand/20 transition-all group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-cookie-brand group-hover:text-white transition-colors">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{emp.name}</p>
                                            <p className="text-xs text-gray-500">{emp.role} • {emp.code}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-300 group-hover:text-cookie-brand" size={18} />
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                No se encontraron colaboradores
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
