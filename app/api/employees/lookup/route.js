import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// GET /api/employees/lookup?code=XXXX
// Returns basic employee info for registration autocomplete
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

    // Check if this employee already has a registered account
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
