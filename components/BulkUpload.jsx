'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';

export default function BulkUpload() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

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
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file) => {
        setFile(file);
        setMessage(null);
        setLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays

                // Basic validation and preview logic
                // Assuming Header Row: Name | Code | Date1 | Date2 ...
                if (jsonData.length < 2) throw new Error("Archivo vacío o formato incorrecto");

                const headers = jsonData[0];
                const rows = jsonData.slice(1);

                // Simple preview limiting to 5 rows
                setPreviewData({ headers, rows: rows.slice(0, 5), totalRows: rows.length });
            } catch (err) {
                setMessage({ type: 'error', text: 'Error al leer el archivo. Verifica el formato.' });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        // We need to parse fully here to send structured data to API
        // Or send file to API. Client-side parsing is better for feedback.

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Parse with raw:false to get formatted dates if possible, or handle Excel dates
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Transform logic: 
                // We expect columns like 'Code' (for ID) and Dates (YYYY-MM-DD or excel serials)
                // This part requires strict template adherence.
                // Let's assume the user downloads a template first.

                // Simplified Logic: Send raw rows to API and let server match employees?
                // Let's try to structure it here.
                // Iterate keys of each row. if key is a date, that's a shift.

                const shifts = [];

                jsonData.forEach(row => {
                    const employeeCode = row['Código'] || row['Code']; // Critical field
                    if (!employeeCode) return;

                    Object.keys(row).forEach(key => {
                        if (key === 'Nombre' || key === 'Name' || key === 'Código' || key === 'Code') return;

                        // Assume key IS the date string YYYY-MM-DD
                        // Excel might give 45678 (serial). 
                        // We will assume simpler text dates for now or ISO strings.
                        const shiftType = row[key]; // M, T, N, L
                        if (shiftType) {
                            shifts.push({
                                employeeCode: String(employeeCode),
                                date: key,
                                type: String(shiftType).toUpperCase()
                            });
                        }
                    });
                });

                // Send to API
                const res = await fetch('/api/shifts/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shifts })
                });

                const result = await res.json();

                if (result.success) {
                    setMessage({ type: 'success', text: `Se cargaron ${result.count} turnos correctamente.` });
                    setFile(null);
                    setPreviewData(null);
                } else {
                    setMessage({ type: 'error', text: result.message || 'Error en la carga.' });
                }

            } catch (err) {
                console.error(err);
                setMessage({ type: 'error', text: 'Error procesando datos.' });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const downloadTemplate = () => {
        // Generate a simple template
        const ws = XLSX.utils.json_to_sheet([
            { "Nombre": "Juan Perez", "Código": "EMP001", "2024-01-01": "M", "2024-01-02": "T" }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        XLSX.writeFile(wb, "Plantilla_Horarios.xlsx");
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
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="text-green-600 h-8 w-8" />
                            <div>
                                <p className="font-bold text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                        </div>
                        <button onClick={() => { setFile(null); setPreviewData(null); setMessage(null); }} className="text-gray-400 hover:text-red-500 p-2"><X /></button>
                    </div>

                    {previewData && (
                        <div className="overflow-x-auto border rounded-lg text-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        {previewData.headers.map((h, i) => <th key={i} className="p-2 border-b font-medium text-gray-600">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.rows.map((row, i) => (
                                        <tr key={i} className="border-b">
                                            {row.map((cell, j) => <td key={j} className="p-2 text-gray-500">{cell}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-2 text-center text-gray-400 text-xs bg-gray-50">
                                Mostrando {previewData.rows.length} de {previewData.totalRows} filas detectadas
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            {message.text}
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        className="w-full cookie-button flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Procesar y Guardar'}
                    </button>
                </div>
            )}
        </div>
    );
}
