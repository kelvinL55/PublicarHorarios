'use client';

import { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, X, Users, Calendar, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { getCurrentWorkPeriod, getWorkPeriodDates } from '@/lib/workPeriod';
import { parseExcelData } from '@/lib/excelParser';

export default function BulkUpload() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Estados para la validación y pre-análisis
    const [masterEmployeesList, setMasterEmployeesList] = useState([]);
    const [parseResult, setParseResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [creatingUsers, setCreatingUsers] = useState(false);

    // Cargar empleados al montar
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch('/api/employees');
                if (res.ok) {
                    const data = await res.json();
                    setMasterEmployeesList(data);
                }
            } catch (err) {
                console.error("Error cargando lista de empleados maestra:", err);
            }
        };
        fetchEmployees();
    }, []);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, [masterEmployeesList]);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file) => {
        setFile(file);
        setMessage(null);
        setParseResult(null);
        setLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const result = parseExcelData(data, masterEmployeesList);

                if (result.success) {
                    setParseResult(result);
                } else {
                    setMessage({ type: 'error', text: result.error });
                    setFile(null);
                }
            } catch (err) {
                setMessage({ type: 'error', text: 'Error inesperado al leer el archivo.' });
                setFile(null);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUpload = async () => {
        if (!file || !parseResult) return;

        // Si hay hallazgos nuevos o diferencias de nube, mostrar modal e interrumpir
        const hasNew = parseResult.newFindings && parseResult.newFindings.length > 0;
        const hasUpdates = parseResult.nameUpdates && parseResult.nameUpdates.length > 0;

        if (hasNew || hasUpdates) {
            setShowConfirmModal(true);
            return;
        }

        // Si no hay hallazgos, proceder directamente a cargar turnos
        await uploadShiftsOnly();
    };

    const uploadShiftsOnly = async () => {
        setLoading(true);
        try {
            const shifts = parseResult.shiftsData;
            const res = await fetch('/api/shifts/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shifts, replace: true })
            });

            const result = await res.json();

            if (result.success) {
                setMessage({ type: 'success', text: `Se actualizaron ${result.count} turnos correctamente para el periodo.` });
                setFile(null);
                setParseResult(null);

                // Disparar un recargo de empleados por si acaso, aunque aquí solo subimos turnos.
                // En el caso con nuevos usuarios, masterEmployeesList se debe actualizar.
                const resEmp = await fetch('/api/employees');
                if (resEmp.ok) {
                    const data = await resEmp.json();
                    setMasterEmployeesList(data);
                }
            } else {
                setMessage({ type: 'error', text: result.message || 'Error en la carga de turnos.' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Error procesando datos en el servidor.' });
        } finally {
            setLoading(false);
            setShowConfirmModal(false);
        }
    };

    // Autoriza la creación de usuarios y luego sube los turnos
    const handleConfirmNewUsers = async () => {
        setCreatingUsers(true);
        try {
            // 1. Crear usuarios / empleados y actualizar nombres
            const resCreate = await fetch('/api/employees/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newEmployees: parseResult.newFindings || [],
                    updatedEmployees: parseResult.nameUpdates || []
                })
            });

            const createResult = await resCreate.json();

            if (!createResult.success) {
                setMessage({ type: 'error', text: createResult.message || 'Error al crear los nuevos usuarios.' });
                setCreatingUsers(false);
                setShowConfirmModal(false);
                return;
            }

            // 2. Subir turnos una vez creados los empleados exitosamente
            await uploadShiftsOnly();

        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Error en la sincronización de usuarios.' });
            setCreatingUsers(false);
        }
    };

    const handleCancel = () => {
        setFile(null);
        setParseResult(null);
        setMessage(null);
    };

    const downloadTemplate = async () => {
        try {
            setLoading(true);
            const period = getCurrentWorkPeriod();
            const dates = getWorkPeriodDates(period.displayMonth.getFullYear(), period.displayMonth.getMonth());
            const dateStrings = dates.map(d => format(d, 'yyyy-MM-dd'));

            const startStr = dateStrings[0];
            const endStr = dateStrings[dateStrings.length - 1];

            const [empRes, shiftRes] = await Promise.all([
                fetch('/api/employees'),
                fetch(`/api/shifts?startDate=${startStr}&endDate=${endStr}`)
            ]);

            const employees = await empRes.json();
            const shifts = await shiftRes.json();

            let data = [];

            if (Array.isArray(employees) && employees.length > 0) {
                data = employees.map(emp => {
                    const row = {
                        "Nombre": emp.name,
                        "Código": emp.code
                    };

                    dateStrings.forEach(dateStr => {
                        const shift = (shifts || []).find(s => (s.employeeId === emp.id || s.employeeCode === emp.code) && s.date === dateStr);
                        row[dateStr] = shift ? shift.type : '';
                    });

                    return row;
                });
            } else {
                data = [
                    { "Nombre": "Ejemplo Empleado", "Código": "EMP000", [dateStrings[0]]: "M", [dateStrings[1]]: "T" }
                ];
            }

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Horarios");
            XLSX.writeFile(wb, `Plantilla_Horarios_${format(period.displayMonth, 'MMM_yyyy')}.xlsx`);

            setMessage({ type: 'success', text: 'Plantilla generada con datos actuales.' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Error al generar la plantilla dinámicamente.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-cookie-light p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-cookie-dark flex items-center gap-2">
                    <FileSpreadsheet className="text-green-600" /> Carga Masiva (Excel)
                </h2>
                <button onClick={downloadTemplate} className="text-sm text-blue-600 hover:underline">Descargar Plantilla</button>
            </div>

            {!file ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragActive ? 'border-cookie-brand bg-cookie-brand/5' : 'border-gray-300 hover:border-cookie-brand'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Arrastra tu archivo Excel aquí</p>
                    <p className="text-gray-400 text-sm mb-4">o</p>
                    <label className="cookie-button cursor-pointer inline-block">
                        Seleccionar Archivo
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleChange} />
                    </label>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="text-green-600 h-8 w-8" />
                            <div>
                                <p className="font-bold text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                        </div>
                        <button onClick={handleCancel} className="text-gray-400 hover:text-red-500 p-2 transition-colors"><X /></button>
                    </div>

                    {/* Dashboard de Pre-análisis Informativo */}
                    {parseResult && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl shadow-sm text-center">
                                <Users className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                                <h3 className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest mb-1">Colaboradores</h3>
                                <p className="text-3xl font-black text-indigo-900">{parseResult.analysis.collaboratorsCount}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm text-center">
                                <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                <h3 className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-1">Periodo Determinado</h3>
                                <p className="text-lg font-bold text-blue-900 mt-2">{parseResult.analysis.periodMonth}</p>
                            </div>
                            <div className="bg-green-50 border border-green-100 p-4 rounded-xl shadow-sm text-center">
                                <BarChart3 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                <h3 className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1">Días Cifrados</h3>
                                <p className="text-3xl font-black text-green-900">{parseResult.analysis.daysCount}</p>
                            </div>
                        </div>
                    )}

                    {/* Previsualización de Datos (Primeras Filas) */}
                    {parseResult && parseResult.previewData && (
                        <div className="overflow-x-auto border rounded-xl shadow-sm text-sm">
                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                                <p className="font-bold text-gray-700 text-xs uppercase tracking-wider">Vista Previa (Extracto de Fila 1 a 5)</p>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-white">
                                    <tr>
                                        {parseResult.previewData.headers.slice(0, 10).map((h, i) => <th key={i} className="p-3 border-b font-medium text-gray-500 text-xs whitespace-nowrap">{h}</th>)}
                                        {parseResult.previewData.headers.length > 10 && <th className="p-3 border-b font-medium text-gray-500 text-xs text-center border-l bg-gray-50">+{parseResult.previewData.headers.length - 10}</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {parseResult.previewData.rows.map((row, i) => (
                                        <tr key={i} className="border-b bg-white hover:bg-gray-50 transition-colors">
                                            {row.slice(0, 10).map((cell, j) => <td key={j} className="p-3 text-gray-700 whitespace-nowrap text-sm font-medium">{cell}</td>)}
                                            {row.length > 10 && <td className="p-3 text-gray-400 text-center border-l bg-gray-50/50">...</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-2.5 text-center text-gray-500 text-xs bg-gray-50 font-medium tracking-wide">
                                Analizadas masivamente {parseResult.previewData.totalRows} filas válidas de la plantilla
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 shadow-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                            {message.type === 'success' ? <CheckCircle size={24} className="text-green-600 shrink-0" /> : <AlertTriangle size={24} className="text-red-600 shrink-0" />}
                            <p className="font-medium">{message.text}</p>
                        </div>
                    )}

                    {parseResult && !message && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-900 text-sm shadow-sm">
                            <AlertTriangle className="shrink-0 mt-0.5 text-amber-600" size={20} />
                            <div>
                                <p className="font-bold mb-1">Reemplazo Permanente</p>
                                <p>Todos los turnos actualmente en el sistema para este periodo serán sobreescritos por los datos de este archivo.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={handleCancel}
                            disabled={loading || creatingUsers}
                            className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-sm"
                        >
                            <X size={20} /> Cancelar y Descartar
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={loading || creatingUsers || !parseResult}
                            className="flex-[2] bg-cookie-brand hover:bg-cookie-dark text-white font-bold px-4 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg focus:ring-4 focus:ring-cookie-brand/30"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle size={20} />}
                            {loading ? 'Procesando Carga...' : (parseResult?.newFindings?.length > 0 ? 'Siguiente: Revisar Nuevos Hallazgos' : 'Confirmar y Guardar Turnos')}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación para Sincronización de Nuevos Usuarios */}
            {showConfirmModal && parseResult && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0 border-b border-indigo-700">
                            <h3 className="font-bold text-lg md:text-xl flex items-center gap-2">
                                <Users size={24} className="text-indigo-200" />
                                Conflicto de Sincronización
                            </h3>
                            <button onClick={() => setShowConfirmModal(false)} className="text-white hover:text-indigo-100 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-lg" disabled={creatingUsers}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-gray-50 flex-1 relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 opacity-50"></div>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-amber-900 text-sm shadow-sm relative overflow-hidden">
                                <div className="absolute -right-6 -top-6 text-amber-100 rotate-12">
                                    <AlertTriangle size={100} />
                                </div>
                                <div className="relative z-10">
                                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-amber-800">
                                        <AlertTriangle size={20} className="text-amber-600" />
                                        Intervención Requerida
                                    </h4>
                                    <p className="font-bold text-base mb-1">
                                        Hemos detectado discrepancias entre el Excel y la Base de Datos.
                                    </p>
                                    <p className="mb-3">Se procederá automáticamente a sincronizar los datos maestros antes de insertar los turnos.</p>
                                    {parseResult.newFindings?.length > 0 && (
                                        <div className="mt-4 bg-white/60 p-3 rounded-lg border border-amber-100">
                                            <p className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                                                <span>🔑</span> Para registros nuevos: la contraseña por defecto será idéntica al código.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECCIÓN A: CREACIÓN DE NUEVOS */}
                            {parseResult.newFindings?.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h4 className="font-bold text-gray-700 md:text-lg">Empleados a Crear ({parseResult.newFindings.length})</h4>
                                    </div>
                                    <div className="bg-white border text-sm rounded-xl shadow-sm overflow-hidden border-gray-200">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="p-3 px-4 font-bold text-gray-600 w-[140px] uppercase text-xs tracking-wider">Código</th>
                                                    <th className="p-3 font-bold text-gray-600 uppercase text-xs tracking-wider">Nombre Detectado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {parseResult.newFindings.map((finding, idx) => (
                                                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                                        <td className="p-3 px-4">
                                                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-mono font-bold text-xs border border-indigo-200/50 shadow-sm inline-block">
                                                                {finding.code}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-gray-700 font-medium">{finding.name}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN B: ACTUALIZACIÓN DE NOMBRES */}
                            {parseResult.nameUpdates?.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h4 className="font-bold text-gray-700 md:text-lg flex items-center gap-2">Nombres a Actualizar ({parseResult.nameUpdates.length})</h4>
                                    </div>
                                    <div className="bg-white border text-sm rounded-xl shadow-sm overflow-hidden border-gray-200">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="p-3 px-4 font-bold text-gray-600 w-[140px] uppercase text-xs tracking-wider">Código</th>
                                                    <th className="p-3 font-bold text-gray-600 uppercase text-xs tracking-wider border-r border-gray-100">Nombre Anterior (BD)</th>
                                                    <th className="p-3 font-bold text-indigo-600 uppercase text-xs tracking-wider">Nuevo Nombre (Excel)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {parseResult.nameUpdates.map((update, idx) => (
                                                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                                        <td className="p-3 px-4">
                                                            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-mono font-bold text-xs border border-gray-200 shadow-sm inline-block">
                                                                {update.code}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-red-500/80 line-through border-r border-gray-100">{update.dbName}</td>
                                                        <td className="p-3 text-green-700 font-bold bg-green-50/30">{update.excelName}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-5 bg-white border-t border-gray-200 flex flex-col-reverse md:flex-row justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={creatingUsers}
                                className="px-5 py-3 text-gray-600 hover:bg-gray-100 font-bold rounded-xl transition-colors disabled:opacity-50 text-sm md:text-base border border-transparent hover:border-gray-200"
                            >
                                Cancelar y Reconfigurar Archivo
                            </button>
                            <button
                                onClick={handleConfirmNewUsers}
                                disabled={creatingUsers}
                                className="bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg focus:ring-4 focus:ring-indigo-600/30 text-white px-6 py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm md:text-base"
                            >
                                {creatingUsers ? (
                                    <> <Loader2 className="animate-spin h-5 w-5" /> Iniciando Sincronización... </>
                                ) : (
                                    <> Autorizar Registros y Subir Turnos </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
