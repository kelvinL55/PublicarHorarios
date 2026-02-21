import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

// POST /api/users/bulk  — carga masiva de usuarios desde Excel
// Body: { users: [{ username, password, role, employeeCode }], replace: boolean }
export async function POST(request) {
    try {
        const { users: incoming, replace } = await request.json();
        const db = getDB();
        let created = 0;
        let updated = 0;

        if (replace) {
            // Eliminar todos los usuarios que NO sean admin para no bloquear el sistema
            db.users = db.users.filter(u => u.role === 'admin');
        }

        for (const row of incoming) {
            if (!row.username) continue;

            // Buscar empleado por código si se provee
            const employee = row.employeeCode
                ? db.employees.find(e => String(e.code) === String(row.employeeCode))
                : null;

            const existingIndex = db.users.findIndex(
                u => u.username.toLowerCase() === row.username.toLowerCase()
            );

            if (existingIndex >= 0) {
                // Actualizar
                db.users[existingIndex] = {
                    ...db.users[existingIndex],
                    role: row.role || db.users[existingIndex].role,
                    status: row.status || db.users[existingIndex].status || 'Active',
                    ...(employee ? { employeeId: employee.id } : {})
                };
                if (row.password) db.users[existingIndex].password = row.password;
                updated++;
            } else {
                // Crear nuevo
                const newId = Math.max(0, ...db.users.map(u => u.id || 0)) + 1;
                db.users.push({
                    id: newId,
                    username: row.username,
                    password: row.password || '1234',
                    role: row.role || 'employee',
                    status: row.status || 'Active',
                    employeeId: employee ? employee.id : null
                });
                created++;
            }
        }

        saveDB(db);
        return NextResponse.json({ success: true, created, updated });
    } catch (error) {
        console.error('Bulk user upload error:', error);
        return NextResponse.json({ success: false, message: 'Error procesando datos' }, { status: 500 });
    }
}
