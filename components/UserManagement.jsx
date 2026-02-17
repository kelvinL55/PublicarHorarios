'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Lock, Save, X, Loader2, CheckCircle } from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ id: null, password: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser({ ...user });
    };

    const handleSaveEdit = async () => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser)
            });
            if (res.ok) {
                setEditingUser(null);
                fetchUsers();
            }
        } catch (err) {
            alert('Error al guardar');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/users?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) fetchUsers();
        } catch (err) {
            alert('Error al eliminar');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordData.password) return alert('Ingresa una contraseña');
        setActionLoading(true);
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: passwordData.id, password: passwordData.password })
            });
            if (res.ok) {
                setPasswordModalOpen(false);
                setPasswordData({ id: null, password: '' });
                alert('Contraseña actualizada correctamente');
            }
        } catch (err) {
            alert('Error al cambiar contraseña');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-cookie-brand" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-cookie-light overflow-hidden">
            <div className="p-4 bg-cookie-cream border-b border-cookie-light flex justify-between items-center">
                <h2 className="text-xl font-bold text-cookie-dark">Gestión de Usuarios</h2>
                <button onClick={fetchUsers} className="text-sm text-cookie-brand hover:underline">Refrescar</button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="p-4 w-12 text-center">#</th>
                            <th className="p-4">Usuario</th>
                            <th className="p-4">Empleado</th>
                            <th className="p-4">Rol</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user, index) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="p-4 text-center text-gray-400 font-mono text-xs">{index + 1}</td>
                                <td className="p-4 font-medium text-gray-900">{user.username}</td>
                                <td className="p-4 text-gray-600">{user.employeeName || 'N/A'} <span className="text-xs text-gray-400">({user.employeeCode})</span></td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.role === 'admin' ? 'Administrador' : 'Empleado'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Inactive' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                        {user.status === 'Inactive' ? 'Ex empleado' : 'Activo'}
                                    </span>
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                    <button onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit size={16} /></button>
                                    <button onClick={() => { setPasswordData({ id: user.id, password: '' }); setPasswordModalOpen(true); }} className="p-2 text-orange-600 hover:bg-orange-50 rounded" title="Cambiar Contraseña"><Lock size={16} /></button>
                                    <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* EDIT MODAL */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold mb-4">Editar Usuario</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500">Nombre de Usuario</label>
                                <input className="input-field" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Rol</label>
                                <select className="input-field" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                                    <option value="employee">Empleado</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Estado</label>
                                <select className="input-field" value={editingUser.status || 'Active'} onChange={e => setEditingUser({ ...editingUser, status: e.target.value })}>
                                    <option value="Active">Activo</option>
                                    <option value="Inactive">Ex empleado</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button onClick={handleSaveEdit} disabled={actionLoading} className="cookie-button flex items-center gap-2">
                                    {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PASSWORD MODAL */}
            {passwordModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold mb-4">Cambiar Contraseña</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500">Nueva Contraseña</label>
                                <input type="text" className="input-field" value={passwordData.password} onChange={e => setPasswordData({ ...passwordData, password: e.target.value })} placeholder="Escribe la nueva contraseña" />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setPasswordModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button onClick={handlePasswordChange} disabled={actionLoading} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                    {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle className="h-4 w-4" />} Actualizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
