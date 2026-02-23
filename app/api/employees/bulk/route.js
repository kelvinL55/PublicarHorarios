import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

export async function POST(request) {
    try {
        const { newEmployees, updatedEmployees } = await request.json();

        const hasNew = newEmployees && Array.isArray(newEmployees) && newEmployees.length > 0;
        const hasUpdates = updatedEmployees && Array.isArray(updatedEmployees) && updatedEmployees.length > 0;

        if (!hasNew && !hasUpdates) {
            return NextResponse.json({ success: false, message: 'No se recibieron empleados para procesar.' }, { status: 400 });
        }

        const db = getDB();

        let createdEmployeesCount = 0;
        let updatedEmployeesCount = 0;

        if (hasNew) {
            newEmployees.forEach(emp => {
                // Un número simple para generar un ID (En DB real usar UUID o autoincrement)
                const newEmpId = Date.now() + Math.floor(Math.random() * 10000);

                // 1. Crear el Empleado
                const employeeData = {
                    id: newEmpId,
                    name: emp.name || 'Sin Nombre',
                    code: String(emp.code),
                    joinDate: new Date().toISOString().split('T')[0],
                    role: 'Empleado' // Rol general de empleado en el sistema
                };

                db.employees.push(employeeData);

                // 2. Crear el Usuario con la contraseña igual al código, rol "employee"
                const newUserId = Date.now() + Math.floor(Math.random() * 10000);

                const userData = {
                    id: newUserId,
                    username: String(emp.code).toLowerCase(), // retrocompatibilidad para antiguos
                    password: String(emp.code), // Solicitado en los requerimientos
                    role: 'employee',
                    employeeId: newEmpId,
                    status: 'Active'
                };

                db.users.push(userData);
                createdEmployeesCount++;
            });
        }

        // Procesar Actualizaciones (Updates)
        if (hasUpdates) {
            updatedEmployees.forEach(upd => {
                const targetCode = String(upd.code).trim().toLowerCase();
                const empIndex = db.employees.findIndex(e => String(e.code).trim().toLowerCase() === targetCode);

                if (empIndex !== -1) {
                    db.employees[empIndex].name = upd.excelName;
                    updatedEmployeesCount++;
                }
            });
        }

        saveDB(db);

        return NextResponse.json({
            success: true,
            message: `Se crearon ${createdEmployeesCount} empleados y se actualizaron ${updatedEmployeesCount} nombres.`,
            createdCount: createdEmployeesCount,
            updatedCount: updatedEmployeesCount
        });

    } catch (error) {
        console.error("Error bulk creating employees:", error);
        return NextResponse.json({ success: false, message: 'Error en la inserción masiva.' }, { status: 500 });
    }
}
