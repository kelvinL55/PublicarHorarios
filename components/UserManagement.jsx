'use client';

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Edit, Trash2, Lock, Save, X, Loader2, CheckCircle, Download, Upload, AlertTriangle } from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ id: null, password: '' });
    const [actionLoading, setActionLoading] = useState(false);

    // Bulk upload state
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkPreview, setBulkPreview] = useState(null); // { headers, rows, rawData }
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkMessage, setBulkMessage] = useState(null);
    const fileInputRef = useRef(null);

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

    // ─── Excel Template Download ────────────────────────────────────────────────
    const downloadTemplate = async () => {
        setBulkLoading(true);
        try {
            const res = await fetch('/api/users');
            const existingUsers = await res.json();

            const empRes = await fetch('/api/employees');
            const employees = await empRes.json();

            let data;
            if (existingUsers.length > 0) {
                data = existingUsers.map(u => ({
                    'Usuario': u.username,
                    'Contraseña': '',             // No exportamos passwords reales
                    'Rol': u.role === 'admin' ? 'admin' : 'employee',
                    'Codigo Empleado': u.employeeCode || '',
                    'Estado': u.status || 'Active'
                }));
            } else {
                data = [
                    { 'Usuario': 'john.doe', 'Contraseña': '1234', 'Rol': 'employee', 'Codigo Empleado': 'EMP001', 'Estado': 'Active' },
                    { 'Usuario': 'jane.admin', 'Contraseña': '1234', 'Rol': 'admin', 'Codigo Empleado': '', 'Estado': 'Active' }
                ];
            }

            // Second sheet — reference of employees
            const empData = (Array.isArray(employees) ? employees : []).map(e => ({
                'Codigo': e.code,
                'Nombre': e.name
            }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Usuarios');
            if (empData.length > 0) {
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(empData), 'Referencia Empleados');
            }
            XLSX.writeFile(wb, 'Plantilla_Usuarios.xlsx');
            setBulkMessage({ type: 'success', text: 'Plantilla descargada correctamente.' });
        } catch (err) {
            console.error(err);
            setBulkMessage({ type: 'error', text: 'Error al generar la plantilla.' });
        } finally {
            setBulkLoading(false);
        }
    };

    // ─── Excel File Processing ──────────────────────────────────────────────────
    const processFile = (file) => {
        if (!file) return;
        setBulkFile(file);
        setBulkMessage(null);
        setBulkPreview(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json(ws);
                const allRows = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (allRows.length < 2) {
                    setBulkMessage({ type: 'error', text: 'El archivo está vacío o no tiene datos.' });
                    return;
                }
                const headers = allRows[0];
                const rows = allRows.slice(1, 6); // preview first 5 rows

                setBulkPreview({ headers, rows, rawData, totalRows: rawData.length });
            } catch (e) {
                setBulkMessage({ type: 'error', text: 'Error leyendo el archivo Excel.' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
        e.target.value = '';
    };

    // ─── Bulk Upload Submit ─────────────────────────────────────────────────────
    const handleBulkUpload = async () => {
        if (!bulkPreview?.rawData) return;
        setBulkLoading(true);
        try {
            const usersPayload = bulkPreview.rawData.map(row => ({
                username: String(row['Usuario'] || '').trim(),
                password: String(row['Contraseña'] || '').trim() || '1234',
                role: String(row['Rol'] || 'employee').trim().toLowerCase(),
                employeeCode: String(row['Codigo Empleado'] || '').trim(),
                status: String(row['Estado'] || 'Active').trim()
            })).filter(u => u.username);

            const res = await fetch('/api/users/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: usersPayload, replace: true })
            });

            const result = await res.json();
            if (result.success) {
                setBulkMessage({ type: 'success', text: `Carga completada: ${result.created} creados, ${result.updated} actualizados.` });
                setBulkFile(null);
                setBulkPreview(null);
                fetchUsers();
            } else {
                setBulkMessage({ type: 'error', text: result.message || 'Error en la carga.' });
            }
        } catch (err) {
            console.error(err);
            setBulkMessage({ type: 'error', text: 'Error al procesar los datos.' });
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkCancel = () => {
        setBulkFile(null);
        setBulkPreview(null);
        setBulkMessage(null);
    };

    // ─── User CRUD ──────────────────────────────────────────────────────────────
    const handleEdit = (user) => setEditingUser({ ...user });

    const handleSaveEdit = async () => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser)
            });
            if (res.ok) { setEditingUser(null); fetchUsers(); }
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
            const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
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
        <div className="space-y-4">
            {/* ── USER TABLE ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-lg border border-cookie-light overflow-hidden">
                <div className="p-2 md:p-4 bg-cookie-cream border-b border-cookie-light flex justify-between items-center">
                    <h2 className="text-lg md:text-xl font-bold text-cookie-dark">Gestión de Usuarios</h2>
                    <button onClick={fetchUsers} className="text-xs md:text-sm text-cookie-brand hover:underline">Refrescar</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-[10px] md:text-xs uppercase">
                            <tr>
                                <th className="p-2 md:p-4 w-10 md:w-12 text-center">#</th>
                                <th className="p-2 md:p-4">Usuario</th>
                                <th className="p-2 md:p-4">Empleado</th>
                                <th className="p-2 md:p-4">Rol</th>
                                <th className="p-2 md:p-4">Estado</th>
                                <th className="p-2 md:p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user, index) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="p-2 md:p-4 text-center text-gray-400 font-mono text-[10px] md:text-xs">{index + 1}</td>
                                    <td className="p-2 md:p-4 font-medium text-gray-900 text-sm md:text-base">{user.username}</td>
                                    <td className="p-2 md:p-4 text-gray-600 text-xs md:text-sm">
                                        <div className="truncate max-w-[120px] md:max-w-none">
                                            {user.employeeName || 'Sin Asignar'}
                                        </div>
                                        <span className="text-[10px] md:text-xs text-gray-400">({user.employeeCode})</span>
                                    </td>
                                    <td className="p-2 md:p-4">
                                        <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {user.role === 'admin' ? 'Admin' : 'Emp'}
                                        </span>
                                    </td>
                                    <td className="p-2 md:p-4">
                                        <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${user.status === 'Inactive' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                            {user.status === 'Inactive' ? 'Ex' : 'Act'}
                                        </span>
                                    </td>
                                    <td className="p-2 md:p-4 flex justify-center gap-1 md:gap-2">
                                        <button onClick={() => handleEdit(user)} className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit size={14} className="md:w-4 md:h-4" /></button>
                                        <button onClick={() => { setPasswordData({ id: user.id, password: '' }); setPasswordModalOpen(true); }} className="p-1.5 md:p-2 text-orange-600 hover:bg-orange-50 rounded" title="Password"><Lock size={14} className="md:w-4 md:h-4" /></button>
                                        <button onClick={() => handleDelete(user.id)} className="p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={14} className="md:w-4 md:h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── BULK UPLOAD PANEL ────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-lg border border-cookie-light overflow-hidden">
                <div className="p-4 bg-cookie-cream border-b border-cookie-light flex justify-between items-center">
                    <h2 className="text-lg font-bold text-cookie-dark">Carga Masiva de Usuarios</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={downloadTemplate}
                            disabled={bulkLoading}
                            className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 font-medium disabled:opacity-50"
                        >
                            <Download size={15} /> Descargar Plantilla
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={bulkLoading}
                            className="flex items-center gap-1.5 text-sm text-cookie-brand hover:text-cookie-dark font-medium disabled:opacity-50"
                        >
                            <Upload size={15} /> Cargar Excel
                        </button>
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileInput} />
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {!bulkFile && !bulkMessage && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-cookie-brand hover:bg-cookie-cream/30 transition-all"
                        >
                            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                            <p className="text-gray-500 text-sm">Haz clic o arrastra un archivo Excel aquí</p>
                            <p className="text-xs text-gray-400 mt-1">Formato: Usuario, Contraseña, Rol, Codigo Empleado, Estado</p>
                        </div>
                    )}

                    {/* Preview */}
                    {bulkPreview && !bulkMessage && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <CheckCircle size={16} className="text-green-600" />
                                Archivo cargado: <span className="text-cookie-brand">{bulkFile?.name}</span>
                                <span className="text-gray-400 ml-auto">{bulkPreview.totalRows} usuarios detectados</span>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            {bulkPreview.headers.map((h, i) => (
                                                <th key={i} className="p-2 border-b font-medium text-gray-600 text-left">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bulkPreview.rows.map((row, i) => (
                                            <tr key={i} className="border-b">
                                                {row.map((cell, j) => <td key={j} className="p-2 text-gray-500">{cell}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-2 text-center text-gray-400 text-xs bg-gray-50">
                                    Mostrando {bulkPreview.rows.length} de {bulkPreview.totalRows} filas
                                </div>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-start gap-3 text-orange-800 text-sm">
                                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="font-bold">Advertencia de Reemplazo</p>
                                    <p>Al aceptar, todos los usuarios (excepto administradores) serán <strong>eliminados y reemplazados</strong> por los usuarios del Excel. La contraseña por defecto es <code className="bg-orange-100 px-1 rounded">1234</code> si no se especifica.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleBulkCancel}
                                    disabled={bulkLoading}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <X size={18} /> Cancelar
                                </button>
                                <button
                                    onClick={handleBulkUpload}
                                    disabled={bulkLoading}
                                    className="flex-[2] cookie-button flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {bulkLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle size={18} />}
                                    {bulkLoading ? 'Procesando...' : 'Aceptar Cambios'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Feedback message */}
                    {bulkMessage && (
                        <div className={`p-4 rounded-lg flex items-center justify-between gap-2 ${bulkMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <div className="flex items-center gap-2">
                                {bulkMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                {bulkMessage.text}
                            </div>
                            <button onClick={() => setBulkMessage(null)} className="p-1 rounded hover:bg-black/10">
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── EDIT MODAL ───────────────────────────────────────────────────── */}
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

            {/* ── PASSWORD MODAL ───────────────────────────────────────────────── */}
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
