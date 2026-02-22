import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// GET /api/auth/users-with-codes
// Devuelve una lista de { username, employeeCode } para el autocompletado del login.
// Resuelve employeeCode desde la tabla employees si no está almacenado directamente en el usuario.
export async function GET() {
    const db = getDB();

    const usersWithCodes = db.users
        .filter(u => u.status !== 'Inactive')
        .map(u => {
            // 1. Usar el employeeCode almacenado si está disponible
            let code = u.employeeCode || null;

            // 2. De lo contrario, buscarlo en la tabla employees a través de employeeId
            if (!code && u.employeeId) {
                const emp = db.employees.find(e => e.id === u.employeeId);
                if (emp) code = emp.code;
            }

            return {
                username: u.username,
                employeeCode: code
            };
        });

    return NextResponse.json(usersWithCodes);
}
