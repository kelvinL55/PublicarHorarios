import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

export async function POST(request) {
    try {
        const { username, password, employeeCode } = await request.json();
        const db = getDB();

        // 1. Check if username already exists
        if (db.users.find(u => u.username === username)) {
            return NextResponse.json({ success: false, message: 'El usuario ya existe' }, { status: 400 });
        }

        // 2. Validate Employee Code
        const employee = db.employees.find(e => e.code === employeeCode);
        if (!employee) {
            return NextResponse.json({ success: false, message: 'Código de empleado no válido' }, { status: 400 });
        }

        // 3. Check if employee already has a user account
        if (db.users.find(u => u.employeeId === employee.id)) {
            return NextResponse.json({ success: false, message: 'Este empleado ya tiene una cuenta registrada' }, { status: 400 });
        }

        // 4. Create User
        const newUser = {
            id: Date.now(),
            username,
            password, // In real app, hash this!
            role: 'employee',
            employeeId: employee.id
        };

        db.users.push(newUser);
        saveDB(db);

        return NextResponse.json({ success: true, user: { username, role: 'employee' } });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error en el servidor' }, { status: 500 });
    }
}
