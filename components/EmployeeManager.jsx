'use client';

import { useState } from 'react';
import { Plus, UserPlus, X, Loader2 } from 'lucide-react';

export default function EmployeeManager({ isOpen, onClose, onEmployeeAdded }) {
    const [formData, setFormData] = useState({ name: '', code: '', joinDate: '', role: '' });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setFormData({ name: '', code: '', joinDate: '', role: '' });
                if (onEmployeeAdded) onEmployeeAdded();
                onClose();
            }
        } catch (err) {
            alert('Error al agregar empleado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-2xl border border-cookie-light w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-cookie-dark flex items-center gap-2">
                        <Plus className="text-cookie-brand" /> Registrar Personal
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cookie-brand outline-none"
                            placeholder="Ej: Juan Perez"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código de Empleado</label>
                        <input
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cookie-brand outline-none"
                            placeholder="Ej: EMP004"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cookie-brand outline-none"
                            value={formData.joinDate}
                            onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Puesto / Cargo</label>
                        <input
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cookie-brand outline-none"
                            placeholder="Ej: Supervisor"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            required
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-cookie-brand text-white px-6 py-2 rounded-lg hover:bg-cookie-dark transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            {loading ? 'Guardando...' : 'Registrar Empleado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
