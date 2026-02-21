import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

export async function POST(request) {
    try {
        // username is no longer provided by the user - it's taken from the employee record
        const { password, employeeCode } = await request.json();
        const db = getDB();

        // 1. Validate Employee Code
        const employee = db.employees.find(e => e.code === employeeCode);
        if (!employee) {
            return NextResponse.json({ success: false, message: 'Código de empleado no válido' }, { status: 400 });
        }

        // 2. Check if employee already has a user account
        if (db.users.find(u => u.employeeId === employee.id)) {
            return NextResponse.json({ success: false, message: 'Este empleado ya tiene una cuenta registrada' }, { status: 400 });
        }

        // 3. Use employee full name as the username
        const username = employee.name;

        // 4. Check if username somehow already exists (edge case)
        if (db.users.find(u => u.username === username)) {
            return NextResponse.json({ success: false, message: 'Ya existe un usuario con ese nombre' }, { status: 400 });
        }

        // 5. Create User
        const newUser = {
            id: Date.now(),
            username, // employee's full name
            password, // In real app, hash this!
            role: 'employee',
            status: 'Active',
            employeeId: employee.id,
            employeeName: employee.name,
            employeeCode: employee.code
        };

        db.users.push(newUser);
        saveDB(db);

        return NextResponse.json({ success: true, user: { username, role: 'employee' } });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error en el servidor' }, { status: 500 });
    }
}
