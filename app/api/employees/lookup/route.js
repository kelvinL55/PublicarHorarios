import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// GET /api/employees/lookup?code=XXXX
// Devuelve información básica del empleado para el autocompletado del registro
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ success: false, message: 'Código requerido' }, { status: 400 });
    }

    const db = getDB();
    const employee = db.employees.find(e => e.code === code);

    if (!employee) {
        return NextResponse.json({ success: false, message: 'Código no encontrado' }, { status: 404 });
    }

    // Comprobar si este empleado ya tiene una cuenta registrada
    const existingUser = db.users.find(u => u.employeeId === employee.id);
    if (existingUser) {
        return NextResponse.json({ success: false, message: 'Este empleado ya tiene una cuenta registrada' }, { status: 409 });
    }

    return NextResponse.json({
        success: true,
        name: employee.name,
        type: employee.type || 'Colaborador',
        code: employee.code
    });
}
