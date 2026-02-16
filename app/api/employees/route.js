import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';

export async function GET() {
    const db = getDB();
    return NextResponse.json(db.employees);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const db = getDB();

        const newEmployee = {
            id: Date.now(), // Simple ID generation
            ...body,
            joinDate: body.joinDate || new Date().toISOString().split('T')[0]
        };

        db.employees.push(newEmployee);
        saveDB(db);

        return NextResponse.json({ success: true, employee: newEmployee });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error adding employee' }, { status: 500 });
    }
}
