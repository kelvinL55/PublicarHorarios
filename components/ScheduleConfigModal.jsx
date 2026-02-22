'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ScheduleConfigModal({ isOpen, onClose, scheduleTypes, onSave }) {
    const [types, setTypes] = useState(scheduleTypes);
    const [saving, setSaving] = useState(false);

    // Sincronizar estado local cuando las props cambian o el modal se abre
    useEffect(() => {
        if (isOpen) {
            setTypes(scheduleTypes);
        }
    }, [isOpen, scheduleTypes]);

    if (!isOpen) return null;

    const handleAdd = () => {
        setTypes([...types, { code: '', label: '', color: 'bg-gray-100 text-gray-800 border-gray-300' }]);
    };

    const handleChange = (index, field, value) => {
        const newTypes = [...types];
        newTypes[index][field] = value;
        setTypes(newTypes);
    };

    const handleDelete = (index) => {
        const newTypes = types.filter((_, i) => i !== index);
        setTypes(newTypes);
    };

    const handleSave = async () => {
        setSaving(true);
        // Validación básica
        if (types.some(t => !t.code || !t.label)) {
            alert('Todos los campos son obligatorios');
            setSaving(false);
            return;
        }

        try {
            await onSave(types);
            onClose();
        } catch (error) {
            console.error("Failed to save schedule types", error);
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const colorOptions = [
        { label: 'Amarillo', value: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        { label: 'Naranja', value: 'bg-orange-100 text-orange-800 border-orange-300' },
        { label: 'Azul', value: 'bg-blue-100 text-blue-800 border-blue-300' },
        { label: 'Indigo', value: 'bg-indigo-900 text-white border-indigo-700' },
        { label: 'Verde', value: 'bg-green-100 text-green-800 border-green-300' },
        { label: 'Rojo', value: 'bg-red-100 text-red-800 border-red-300' },
        { label: 'Gris', value: 'bg-gray-100 text-gray-800 border-gray-300' },
        { label: 'Púrpura', value: 'bg-purple-100 text-purple-800 border-purple-300' },
    ];

    const handleDownloadTemplate = () => {
        // Usar los tipos actuales si existen, de lo contrario usar ejemplos por defecto
        const hasData = types.length > 0 && types.some(t => t.code || t.label);

        const effectiveTypes = hasData ? types : [
            { code: 'M', label: 'Mañana', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
            { code: 'T', label: 'Tarde', color: 'bg-orange-100 text-orange-800 border-orange-300' },
            { code: 'N', label: 'Noche', color: 'bg-indigo-900 text-white border-indigo-700' },
            { code: 'L', label: 'Libre', color: 'bg-gray-100 text-gray-800 border-gray-300' }
        ];

        const templateData = effectiveTypes.map(t => ({
            CODIGO: t.code || '',
            DESCRIPCION: t.label || '',
            COLOR: t.color || ''
        }));

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Configuración de Turnos");
        XLSX.writeFile(wb, "plantilla_configuracion_horarios.xlsx");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            // Mapear colores estándar como respaldo si es necesario, o confiar en la entrada del usuario si es una clase válida
            // Mapeo simple por ahora
            const newTypes = data.map(row => ({
                code: row.CODIGO ? String(row.CODIGO).toUpperCase().slice(0, 2) : '??',
                label: row.DESCRIPCION || 'Sin descripción',
                color: row.COLOR || 'bg-gray-100 text-gray-800 border-gray-300'
            })).filter(t => t.code !== '??');

            setTypes(newTypes);
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Configurar Horarios</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex gap-4 mb-4 justify-end">
                        <button
                            onClick={handleDownloadTemplate}
                            className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 hover:underline"
                        >
                            <Download className="w-4 h-4" /> Descargar Plantilla
                        </button>
                        <label className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer">
                            <Upload className="w-4 h-4" /> Cargar Excel
                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>

                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 border-b">
                                <th className="pb-2 pl-2">Código (1-2 letras)</th>
                                <th className="pb-2">Descripción</th>
                                <th className="pb-2">Color</th>
                                <th className="pb-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {types.map((type, index) => (
                                <tr key={index} className="group">
                                    <td className="py-2 pr-2">
                                        <input
                                            type="text"
                                            maxLength={2}
                                            value={type.code}
                                            onChange={(e) => handleChange(index, 'code', e.target.value.toUpperCase())}
                                            className="w-16 p-2 border rounded font-bold text-center uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Ej: M"
                                        />
                                    </td>
                                    <td className="py-2 pr-2">
                                        <input
                                            type="text"
                                            value={type.label}
                                            onChange={(e) => handleChange(index, 'label', e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Ej: Mañana"
                                        />
                                    </td>
                                    <td className="py-2 pr-2">
                                        <select
                                            value={type.color}
                                            onChange={(e) => handleChange(index, 'color', e.target.value)}
                                            className={`w-full p-2 border rounded appearance-none cursor-pointer ${type.color.split(' ')[0]}`}
                                        >
                                            {colorOptions.map(opt => (
                                                <option key={opt.value} value={opt.value} className="bg-white text-black">
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Caja de previsualización */}
                                        <div className={`h-1 mt-1 rounded ${type.color.split(' ')[0]}`}></div>
                                    </td>
                                    <td className="py-2 text-right">
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button
                        onClick={handleAdd}
                        className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Nuevo Horario
                    </button>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {saving && <Loader2 className="animate-spin w-4 h-4" />}
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
    );
}
