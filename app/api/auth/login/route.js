import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function POST(request) {
    try {
        const { username, password, employeeCode } = await request.json();
        const db = getDB();

        let user;

        // 1. Intentar iniciar sesión por Código de Empleado (buscar usuario a través del registro de empleado)
        if (employeeCode) {
            const emp = db.employees.find(e => e.code === employeeCode);
            if (emp) {
                user = db.users.find(u =>
                    (u.employeeId === emp.id || u.employeeCode === employeeCode) &&
                    u.password === password
                );
            }
            // También verificar código de empleado directamente en el registro de usuario
            if (!user) {
                user = db.users.find(u => u.employeeCode === employeeCode && u.password === password);
            }
        }

        // 2. Intentar iniciar sesión por nombre de usuario
        if (!user && username) {
            user = db.users.find(u => u.username === username && u.password === password);
        }

        if (user) {
            if (user.status === 'Inactive') {
                return NextResponse.json(
                    { success: false, message: 'Su cuenta ya no está activa. Agradecemos su tiempo con nosotros.' },
                    { status: 403 }
                );
            }
            const { password: _, ...userWithoutPass } = user;
            return NextResponse.json({ success: true, user: userWithoutPass });
        }

        return NextResponse.json(
            { success: false, message: 'Credenciales inválidas' },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Error del servidor' },
            { status: 500 }
        );
    }
}
