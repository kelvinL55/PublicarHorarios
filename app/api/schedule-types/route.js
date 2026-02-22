import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const dataFilePath = path.join(process.cwd(), 'data.json');

async function readData() {
    try {
        const data = await fs.readFile(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading data:", error);
        return { scheduleTypes: [] };
    }
}

async function writeData(data) {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error("Error writing data:", error);
        return false;
    }
}

export async function GET() {
    const data = await readData();
    // Asegurar tipos predeterminados si no están presentes (fallback de migración)
    const scheduleTypes = data.scheduleTypes || [
        { code: 'M', label: 'Mañana', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        { code: 'T', label: 'Tarde', color: 'bg-orange-100 text-orange-800 border-orange-300' },
        { code: 'N', label: 'Noche', color: 'bg-indigo-900 text-white border-indigo-700' },
        { code: 'L', label: 'Libre', color: 'bg-green-100 text-green-800 border-green-300' }
    ];
    return NextResponse.json(scheduleTypes);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const data = await readData();

        // El cuerpo debe ser el nuevo array de scheduleTypes
        if (Array.isArray(body)) {
            data.scheduleTypes = body;
            await writeData(data);
            return NextResponse.json({ success: true, scheduleTypes: data.scheduleTypes });
        }

        return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
