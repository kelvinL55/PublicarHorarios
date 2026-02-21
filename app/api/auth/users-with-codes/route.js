import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// GET /api/auth/users-with-codes
// Returns list of { username, employeeCode } for login autocomplete.
// Resolves employeeCode from the employees table if not stored directly on the user.
export async function GET() {
    const db = getDB();

    const usersWithCodes = db.users
        .filter(u => u.status !== 'Inactive')
        .map(u => {
            // 1. Use the stored employeeCode if available
            let code = u.employeeCode || null;

            // 2. Otherwise, look it up in the employees table via employeeId
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
