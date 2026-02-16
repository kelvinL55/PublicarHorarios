import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

export async function POST(request) {
    try {
        const { shifts } = await request.json(); // Array of { employeeCode, date, type }
        const db = getDB();
        let count = 0;

        shifts.forEach(incomingShift => {
            // Find employee by Code
            const employee = db.employees.find(e => String(e.code) === String(incomingShift.employeeCode));

            if (employee) {
                // Upsert logic
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
