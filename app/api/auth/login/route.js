import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function POST(request) {
    try {
        const { username, password } = await request.json();
        const db = getDB();

        // Simple authentication
        const user = db.users.find(u => u.username === username && u.password === password);

        if (user) {
            // Check for Inactive status (Ex-employee)
            if (user.status === 'Inactive') {
                return NextResponse.json(
                    { success: false, message: 'Su cuenta ya no está activa. Agradecemos su tiempo con nosotros.' },
                    { status: 403 }
                );
            }

            // In a real app, use JWT or Session cookies. 
            // For this demo, we return user info to store in client context/localstorage.
            const { password, ...userWithoutPass } = user;
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
