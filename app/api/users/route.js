import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

export async function GET() {
    const db = getDB();
    // Unir usuarios con empleados para obtener todos los detalles
    const usersWithDetails = db.users.map(user => {
        const employee = db.employees.find(e => e.id === user.employeeId);
        return {
            ...user,
            employeeName: employee ? employee.name : 'Sin Asignar',
            employeeCode: employee ? employee.code : 'N/A',
            status: user.status || 'Active' // Estado por defecto
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

        // Actualizar campos del usuario
        db.users[userIndex] = { ...db.users[userIndex], ...updates };

        // También actualizar los campos relacionados del Empleado si se proveen (nombre, código)
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
        const id = Number(searchParams.get('id')); // Convertir a número si los IDs son números

        const db = getDB();
        const userIndex = db.users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 404 });
        }

        // En lugar de borrado físico, podemos cambiar el estado o eliminar.
        // El requerimiento dice "Eliminar/Archivar". Eliminaremos por ahora según la implicación del botón "Eliminar",
        // o pondremos el estado a 'Inactive'.
        // Vamos a implementar BORRADO FÍSICO para usuarios, ¿pero mantener registros de empleados?
        // O Borrado Lógico. Hagamos Borrado Lógico (Estado: Inactive) efectivamente.
        // En realidad, el usuario pidió "Opción para eliminar usuarios".

        // ¿Vamos a eliminar el acceso de USUARIO, pero mantener el registro de Empleado?
        // Si eliminamos al usuario de db.users, no podrá iniciar sesión.
        db.users.splice(userIndex, 1);

        saveDB(db);
        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error eliminando usuario' }, { status: 500 });
    }
}
