import * as XLSX from 'xlsx';

/**
 * Parsea, analiza y valida un archivo Excel de turnos u horarios.
 * 
 * @param {ArrayBuffer} fileData - Los datos binarios del archivo Excel.
 * @param {Array} masterEmployeesList - Lista maestra actual de empleados para validación.
 * @returns {Object} Objeto detallado con resultados del análisis, datos de turnos y validaciones.
 */
export function parseExcelData(fileData, masterEmployeesList) {
    try {
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Utilizamos sheet_to_json con header: 1 para obtener un arreglo 2D (filas x columnas)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

        if (!jsonData || jsonData.length < 2) {
            throw new Error("El archivo está vacío o no tiene el formato correcto (requiere fila de encabezados y datos).");
        }

        const headers = jsonData[0];
        const rows = jsonData.slice(1);

        // 1. Identificar columnas (Name y Code) de forma flexible
        const codeIndex = headers.findIndex(h => {
            if (!h) return false;
            const lower = String(h).toLowerCase().trim();
            return lower === 'código' || lower === 'codigo' || lower === 'code';
        });
        const nameIndex = headers.findIndex(h => {
            if (!h) return false;
            const lower = String(h).toLowerCase().trim();
            return lower === 'nombre' || lower === 'name';
        });

        if (codeIndex === -1) {
            throw new Error("No se encontró la columna obligatoria 'Código'.");
        }

        // 2. Extraer índices de columnas de fechas
        const dateColumnsIndexes = [];
        headers.forEach((h, index) => {
            if (index !== codeIndex && index !== nameIndex && h !== null && String(h).trim() !== '') {
                dateColumnsIndexes.push({ index, dateLabel: String(h).trim() });
            }
        });

        if (dateColumnsIndexes.length === 0) {
            throw new Error("No se encontraron columnas de fechas para los turnos.");
        }

        // 3. Determinar el periodo mensual dinámicamente según la lógica de negocio
        const firstDateLabel = dateColumnsIndexes[0].dateLabel;
        let periodDisplay = "Periodo Desconocido";

        // Extraemos partes de la fecha (asumiendo YYYY-MM-DD)
        const dateMatch = firstDateLabel.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
        if (dateMatch) {
            let year = parseInt(dateMatch[1], 10);
            let month = parseInt(dateMatch[2], 10) - 1; // en Date de JS, el mes es 0-indexado
            const day = parseInt(dateMatch[3], 10);

            // Lógica de negocio: Si el día de inicio es 26 o 27, el periodo completo cuenta para el mes siguiente
            if (day === 26 || day === 27) {
                month += 1;
                // Ajuste para diciembre (cuando month = 11 + 1 = 12)
                if (month > 11) {
                    month = 0;
                    year += 1;
                }
            }

            // Construir representación textual del mes, ejemplo: "Marzo 2024"
            const dateObj = new Date(year, month, 1);
            periodDisplay = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            periodDisplay = periodDisplay.charAt(0).toUpperCase() + periodDisplay.slice(1); // Capitalizar
        } else {
            // Fallback si el formato no es YYYY-MM-DD (ej. números en serie de Excel directos)
            periodDisplay = `Iniciando: ${firstDateLabel}`;
        }

        // 4. Analizar filas, validar contra JSON maestro y construir datos
        const uniqueCodes = new Set();
        const newFindings = [];
        const nameUpdates = [];
        const shiftsData = [];
        const previewRows = [];

        // Mapa para búsqueda eficiente O(1)
        const masterCodesMap = new Map();
        if (Array.isArray(masterEmployeesList)) {
            masterEmployeesList.forEach(emp => {
                const codeSafe = String(emp.code || '').trim().toLowerCase();
                if (codeSafe) {
                    masterCodesMap.set(codeSafe, emp);
                }
            });
        }

        let rowIndex = 2; // Fila visual de Excel (la primera de headers es la 1)
        for (const row of rows) {
            if (!row || row.length === 0 || row.every(cell => cell === null || cell === '')) {
                // Ignorar filas totalmente vacías
                rowIndex++;
                continue;
            }

            const codeRaw = row[codeIndex];

            // Restricción estricta: código no nulo
            if (codeRaw === undefined || codeRaw === null || String(codeRaw).trim() === '') {
                throw new Error(`Fila ${rowIndex}: El campo 'Código' es un campo obligatorio y no puede ser nulo o vacío.`);
            }

            const codeStr = String(codeRaw).trim();
            uniqueCodes.add(codeStr);

            const nameStr = (nameIndex !== -1 && row[nameIndex] !== null) ? String(row[nameIndex]).trim() : 'Sin Nombre';

            // Cruce con empleados existentes
            const lowerCode = codeStr.toLowerCase();
            if (!masterCodesMap.has(lowerCode)) {
                // Evitar registrar duplicados en la lista de nuevos
                if (!newFindings.find(f => f.code.toLowerCase() === lowerCode)) {
                    newFindings.push({ code: codeStr, name: nameStr });
                }
            } else {
                // Empleado existe, validar si el nombre fue alterado significativamente
                const existingEmp = masterCodesMap.get(lowerCode);
                const dbName = String(existingEmp.name || '').trim();

                // Compare cleaning up extra spaces and checking lowercase
                const excelClean = nameStr.replace(/\s+/g, ' ').toLowerCase();
                const dbClean = dbName.replace(/\s+/g, ' ').toLowerCase();

                if (excelClean !== dbClean && excelClean !== 'sin nombre') {
                    // Evitar registrar duplicados en la lista de actualizaciones
                    if (!nameUpdates.find(u => u.code.toLowerCase() === lowerCode)) {
                        nameUpdates.push({
                            code: codeStr,
                            excelName: nameStr,
                            dbName: dbName
                        });
                    }
                }
            }

            // Recopilar los turnos asignados
            dateColumnsIndexes.forEach(col => {
                const shiftType = row[col.index];
                if (shiftType !== undefined && shiftType !== null && String(shiftType).trim() !== '') {
                    shiftsData.push({
                        employeeCode: codeStr,
                        date: col.dateLabel,
                        type: String(shiftType).trim().toUpperCase() // M, T, N, L, etc.
                    });
                }
            });

            // Acumular un máximo de 5 filas reales para la vista previa en la UI
            if (previewRows.length < 5) {
                previewRows.push(row);
            }
            rowIndex++;
        }

        return {
            success: true,
            analysis: {
                collaboratorsCount: uniqueCodes.size,
                daysCount: dateColumnsIndexes.length,
                periodMonth: periodDisplay
            },
            newFindings,
            nameUpdates,
            shiftsData,
            previewData: {
                headers,
                rows: previewRows,
                totalRows: rowIndex - 2 // Filas procesadas efectivamente
            }
        };

    } catch (error) {
        // Retornar error de manera controlada para mostrarlo en la UI
        return {
            success: false,
            error: error.message || "Error inesperado al parsear el archivo."
        };
    }
}
