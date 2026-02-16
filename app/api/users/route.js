import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

export async function GET() {
    const db = getDB();
    // Join users with employees to get full details
    const usersWithDetails = db.users.map(user => {
        const employee = db.employees.find(e => e.id === user.employeeId);
        return {
            ...user,
            employeeName: employee ? employee.name : 'Sin Asignar',
            employeeCode: employee ? employee.code : 'N/A',
            status: user.status || 'Active' // Default status
        };
    });
    return NextResponse.json(usersWithDetails);
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const db = getDB();
        const { id, ...updates } = body;

        const userIndex = db.users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 404 });
        }

        // Update User fields
        db.users[userIndex] = { ...db.users[userIndex], ...updates };

        // Also update related Employee fields if provided (name, code)
        if (updates.employeeId && (updates.employeeName || updates.employeeCode)) {
            const empIndex = db.employees.findIndex(e => e.id === updates.employeeId);
            if (empIndex >= 0) {
                if (updates.employeeName) db.employees[empIndex].name = updates.employeeName;
                if (updates.employeeCode) db.employees[empIndex].code = updates.employeeCode;
            }
        }

        saveDB(db);
        return NextResponse.json({ success: true, user: db.users[userIndex] });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error actualizando usuario' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get('id')); // Convert to number if IDs are numbers

        const db = getDB();
        const userIndex = db.users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 404 });
        }

        // Instead of hard delete, we can toggle status or remove. 
        // Requirement says "Delete/Archive". Let's remove for now as per "Delete" button implication, 
        // or set status to 'Inactive'.
        // Let's implement HARD DELETE for users, but keep employee records? 
        // Or Soft Delete. Let's do Soft Delete (Status: Inactive) effectively.
        // Actually, user asked for "Option to delete users". 

        // Let's remove the USER access, but keep the Employee record?
        // If we delete the user from db.users, they can't login.
        db.users.splice(userIndex, 1);

        saveDB(db);
        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error eliminando usuario' }, { status: 500 });
    }
}
