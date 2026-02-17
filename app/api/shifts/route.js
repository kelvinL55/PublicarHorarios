import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM (backward compatibility)
    const startDate = searchParams.get('startDate'); // Format: YYYY-MM-DD
    const endDate = searchParams.get('endDate'); // Format: YYYY-MM-DD
    const db = getDB();

    let shifts = db.shifts;

    // Filtrar por rango de fechas si se proporcionan startDate y endDate
    if (startDate && endDate) {
        shifts = shifts.filter(s => s.date >= startDate && s.date <= endDate);
    }
    // De lo contrario, filtrar por mes (compatibilidad hacia atrás)
    else if (month) {
        shifts = shifts.filter(s => s.date.startsWith(month));
    }

    return NextResponse.json(shifts);
}

export async function POST(request) {
    try {
        const { shifts } = await request.json(); // Array of shifts to update/add
        const db = getDB();

        // Merge logic: Remove old shifts for the same employee/date and add new ones
        // Or just update. For simplicity: Upsert.

        shifts.forEach(newShift => {
            const index = db.shifts.findIndex(s =>
                s.employeeId === newShift.employeeId && s.date === newShift.date
            );

            if (index >= 0) {
                db.shifts[index] = newShift;
            } else {
                db.shifts.push(newShift);
            }
        });

        saveDB(db);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error saving shifts' }, { status: 500 });
    }
}
