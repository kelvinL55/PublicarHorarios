import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

export async function POST(request) {
    try {
        const { shifts, replace } = await request.json(); // Array of { employeeCode, date, type }, replace: boolean
        const db = getDB();
        let count = 0;

        if (replace && shifts.length > 0) {
            // Obtener el rango de fechas de los nuevos turnos
            const dates = shifts.map(s => s.date);
            const minDate = dates.reduce((a, b) => a < b ? a : b);
            const maxDate = dates.reduce((a, b) => a > b ? a : b);

            // Eliminar turnos existentes en ese rango de fechas para evitar duplicados
            db.shifts = db.shifts.filter(s => s.date < minDate || s.date > maxDate);
        }

        shifts.forEach(incomingShift => {
            // Buscar empleado por Código
            const employee = db.employees.find(e => String(e.code) === String(incomingShift.employeeCode));

            if (employee) {
                // Lógica Upsert
                const existingShiftIndex = db.shifts.findIndex(s =>
                    s.employeeId === employee.id && s.date === incomingShift.date
                );

                const newShiftRecord = {
                    employeeId: employee.id,
                    date: incomingShift.date,
                    type: incomingShift.type
                };

                if (existingShiftIndex >= 0) {
                    db.shifts[existingShiftIndex] = newShiftRecord;
                } else {
                    db.shifts.push(newShiftRecord);
                }
                count++;
            }
        });

        saveDB(db);
        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error("Bulk upload error:", error);
        return NextResponse.json({ success: false, message: 'Error procesando datos' }, { status: 500 });
    }
}
