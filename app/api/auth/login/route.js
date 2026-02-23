import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function POST(request) {
    try {
        // Redujimos los campos 'username' y 'employeeCode' a un solo input 'credential'
        const { credential, password } = await request.json();
        const db = getDB();

        if (!credential || !password) {
            return NextResponse.json({ success: false, message: 'Credenciales incompletas' }, { status: 400 });
        }

        let user = null;
        let matchedEmployee = null;

        const credRaw = String(credential).trim();
        const credLower = credRaw.toLowerCase();

        // CASO ESPECIAL 1: Acceso Directo de Administrador Principal (ID 1)
        if (credLower === 'admin') {
            user = db.users.find(u => u.username === 'admin' && u.password === password);
        } else {
            // BUSQUEDA RELACIONAL CRUZADA
            // Paso 1: Encontrar al empleado usando el input (bien sea por 'Código' o por 'Nombre')
            matchedEmployee = db.employees.find(e => {
                const isCodeMatch = String(e.code).trim().toLowerCase() === credLower;
                const isNameMatch = String(e.name).trim().toLowerCase() === credLower;
                return isCodeMatch || isNameMatch;
            });

            // Paso 2: Si encontramos al empleado, buscamos a qué cuenta de usuario (ID) está linkeado
            if (matchedEmployee) {
                user = db.users.find(u => u.employeeId === matchedEmployee.id && u.password === password);
            } else {
                // Fallback de retrocompatibilidad brutal (por si quedan usuarios viejos que no hayan mudado su username)
                // Se intentará encontrar por 'username' estricto
                user = db.users.find(u => String(u.username).trim().toLowerCase() === credLower && u.password === password);
            }
        }

        if (user) {
            if (user.status === 'Inactive') {
                return NextResponse.json(
                    { success: false, message: 'Su cuenta ya no está activa. Agradecemos su tiempo con nosotros.' },
                    { status: 403 }
                );
            }
            // Agregamos el nombre resolutivo encontrado para mostrarlo en UI
            const resolvedName = matchedEmployee ? matchedEmployee.name : (user.username === 'admin' ? 'Administrador' : credRaw);

            const { password: _, ...userWithoutPass } = user;

            return NextResponse.json({
                success: true,
                user: {
                    ...userWithoutPass,
                    displayName: resolvedName
                }
            });
        }

        return NextResponse.json(
            { success: false, message: 'Credenciales inválidas o cuenta no registrada.' },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Error interno del servidor en la autenticación' },
            { status: 500 }
        );
    }
}
