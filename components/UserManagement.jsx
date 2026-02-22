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
    const [bulkData, setBulkData] = useState(null);
    const [bulkPreview, setBulkPreview] = useState(null); // { headers, rows, rawData }
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkMessage, setBulkMessage] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadFeedback, setUploadFeedback] = useState(null);
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

    // ─── Descarga de Plantilla Excel ──────────────────────────────────────────────
    const downloadTemplate = () => {
        // Datos de muestra
        const templateData = [
            {
                "idEmpleado": "1001",
                "Usuario": "juan.perez",
                "Contraseña": "1234",
                "Rol": "employee",
                "NombresEmpleado": "Juan Pérez",
                "Cargo": "Operador",
                "Estado": "Activo",
                "FechaIngreso": "2023-01-15"
            },
            {
                "idEmpleado": "1002",
                "Usuario": "maria.gomez",
                "Contraseña": "1234",
                "Rol": "employee",
                "NombresEmpleado": "María Gómez",
                "Cargo": "Supervisor",
                "Estado": "Activo",
                "FechaIngreso": "2022-05-20"
            },
            {
                "idEmpleado": "",
                "Usuario": "nuevo.usuario",
                "Contraseña": "1234",
                "Rol": "employee",
                "NombresEmpleado": "Nombre del Empleado",
                "Cargo": "Cargo del Empleado",
                "Estado": "Activo",
                "FechaIngreso": "AAAA-MM-DD"
            }
        ];

        // Crear hoja de cálculo
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        // Ajustar ancho de las columnas
        const wscols = [
            { wch: 15 }, // idEmpleado
            { wch: 20 }, // Usuario
            { wch: 15 }, // Contrasena
            { wch: 15 }, // Rol
            { wch: 25 }, // NombresEmpleado
            { wch: 15 }, // Cargo
            { wch: 15 }, // Estado
            { wch: 20 }  // FechaIngreso
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla_Usuarios");
        XLSX.writeFile(workbook, "plantilla_carga_usuarios.xlsx");
    };

    // ─── Procesamiento de Archivo Excel ───────────────────────────────────────────
    const processFile = (file) => {
        if (!file) return;
        setBulkFile(file);
        setBulkMessage(null);
        setBulkPreview(null);
        setBulkData(null); // Clear previous bulk data

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

                // Process rawData into a more usable format for the payload
                const processedData = rawData.map(row => ({
                    employeeCode: String(row['idEmpleado'] || '').trim(),
                    username: String(row['Usuario'] || '').trim(),
                    password: String(row['Contraseña'] || '').trim() || '1234', // Default password if not provided
                    role: String(row['Rol'] || 'employee').trim().toLowerCase(),
                    employeeName: String(row['NombresEmpleado'] || '').trim(),
                    position: String(row['Cargo'] || '').trim(),
                    status: String(row['Estado'] || 'Active').trim(),
                    hireDate: String(row['FechaIngreso'] || '').trim(),
                })).filter(u => u.username); // Only include rows with a username

                setBulkData(processedData);

            } catch (e) {
                console.error("Error reading Excel file:", e);
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

    // ─── Envío de Carga Masiva ─────────────────────────────────────────────────────
    const handleBulkUpload = async () => {
        if (!bulkData || bulkData.length === 0) return;
        setUploadLoading(true);
        setUploadFeedback(null);

        try {
            // El backend iterará y procesará cada fila, retornando resultados (éxito/fallos)
            const res = await fetch('/api/users/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usersData: bulkData })
            });
            const data = await res.json();

            if (data.success) {
                setUploadFeedback({ type: 'success', message: `Éxito: ${data.added} añadidos, ${data.updated} actualizados. Fallos: ${data.errors.length}` });
                // Solo limpiar si hubo fallos, de lo contrario dejar que el usuario recargue
                fetchUsers();
            } else {
                setUploadFeedback({ type: 'error', message: data.message || 'Error en la subida masiva.' });
            }
        } catch (error) {
            setUploadFeedback({ type: 'error', message: 'Error de red durante la subida.' });
        } finally {
            setUploadLoading(false);
            // Si el éxito es total, podríamos limpiar formBulk() después de unos segundos
        }
    };

    const handleBulkCancel = () => {
        setBulkFile(null);
        setBulkPreview(null);
        setBulkMessage(null);
        setBulkData(null);
        setUploadFeedback(null);
    };

    // ─── CRUD de Usuarios ──────────────────────────────────────────────────────────────
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
            {/* Tabla de Usuarios Existentes */}
            <div className="bg-white rounded-xl shadow-sm border border-cookie-light overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-cookie-dark">Usuarios Registrados</h2>
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-600">Total: {users.length}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/50 text-gray-600 border-b border-gray-200">
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

            {/* Sección de Carga Masiva - Sólo Diseño */}
            <div className="bg-white rounded-xl shadow-sm border border-cookie-light p-6 mb-8">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-cookie-dark">Carga Masiva de Usuarios</h2>
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 text-sm text-cookie-brand bg-cookie-brand/10 hover:bg-cookie-brand/20 py-2 px-4 rounded-lg transition-colors font-medium border border-cookie-brand/20"
                    >
                        <Download size={16} /> Descargar Plantilla Excel
                    </button>
                </div>

                {!bulkData ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-cookie-light bg-gray-50/50 hover:bg-white transition-all relative group cursor-pointer">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileInput}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            ref={fileInputRef}
                            title="Haga clic o arrastre un archivo Excel aquí"
                        />
                        <div className="flex flex-col items-center justify-center text-center opacity-70 group-hover:opacity-100 transition-opacity">
                            <div className="bg-cookie-brand/10 p-4 rounded-full mb-4">
                                <Upload className="w-8 h-8 text-cookie-brand" />
                            </div>
                            <p className="text-base font-medium text-gray-700 mb-1">Subir Archivo Excel</p>
                            <p className="text-sm text-gray-500 max-w-sm">Arrastra y suelta tu archivo aquí, o haz clic para seleccionar la plantilla rellenada.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Resumen de Archivo */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-blue-900 font-medium">Archivo listo para procesar</h3>
                                <p className="text-blue-700 text-sm">{bulkData.length} registros detectados</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkCancel}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkUpload}
                                    disabled={uploadLoading || !bulkData || bulkData.length === 0}
                                    className="bg-cookie-brand hover:bg-cookie-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload size={16} />}
                                    Procesar Usuarios
                                </button>
                            </div>
                        </div>

                        {/* Mensaje de Subida */}
                        {uploadFeedback && (
                            <div className={`p-4 rounded-xl flex items-start gap-3 border ${uploadFeedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                {uploadFeedback.type === 'success' ? <CheckCircle className="shrink-0 mt-0.5" size={20} /> : <AlertTriangle className="shrink-0 mt-0.5" size={20} />}
                                <div>
                                    <p className="font-medium text-sm">{uploadFeedback.message}</p>
                                </div>
                                <button onClick={() => setUploadFeedback(null)} className="ml-auto p-1 rounded hover:bg-black/5 opacity-50 hover:opacity-100 transition-opacity">
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Vista Previa de Tabla */}
                        {bulkPreview && (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                <div className="bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-center">
                                    <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                                        Vista Previa <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Primeras 5 filas</span>
                                    </h4>
                                    <span className="text-xs text-gray-500">Total en archivo: {bulkPreview.totalRows} filas</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="bg-white">
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
                                        ... y {Math.max(0, bulkPreview.totalRows - 5)} filas más
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
