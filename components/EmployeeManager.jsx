'use client';

import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';

export default function EmployeeManager({ onEmployeeAdded }) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', joinDate: '', role: '' });
    const [loading, setLoading] = useState(false);

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
                setIsOpen(false);
                if (onEmployeeAdded) onEmployeeAdded();
            }
        } catch (err) {
            alert('Error al agregar empleado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-6">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="cookie-button flex items-center gap-2"
                >
                    <UserPlus size={18} />
                    Nuevo Empleado
                </button>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-cookie-light animate-in fade-in zoom-in duration-300">
                    <h3 className="font-bold text-cookie-dark mb-4 flex items-center gap-2">
                        <Plus className="text-cookie-brand" /> Registrar Personal
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            className="input-field"
                            placeholder="Nombre Completo"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <input
                            className="input-field"
                            placeholder="Código (ej. EMP004)"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            required
                        />
                        <input
                            type="date"
                            className="input-field"
                            value={formData.joinDate}
                            onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                            required
                        />
                        <input
                            className="input-field"
                            placeholder="Puesto / Rol"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            required
                        />
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="cookie-button"
                            >
                                {loading ? 'Guardando...' : 'Registrar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
