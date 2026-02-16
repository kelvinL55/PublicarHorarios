import fs from 'fs';
import path from 'path';

// Define the path to the JSON file
const DB_PATH = path.join(process.cwd(), 'data.json');

// Initial data if file doesn't exist
const INITIAL_DATA = {
    users: [
        { id: 1, username: 'admin', password: 'password123', role: 'admin' },
        { id: 2, username: 'user', password: 'user123', role: 'employee', employeeId: 101 }
    ],
    employees: [
        { id: 101, name: 'Juan Perez', code: 'EMP001', joinDate: '2023-01-15', role: 'Operario' },
        { id: 102, name: 'Maria Gomez', code: 'EMP002', joinDate: '2023-02-20', role: 'Supervisor' },
        { id: 103, name: 'Carlos Ruiz', code: 'EMP003', joinDate: '2023-03-10', role: 'Empaquetador' }
    ],
    shifts: [] // { employeeId, date: 'YYYY-MM-DD', shift: 'Morning'|'Afternoon'|'Night'|'Free' }
};

// Helper to read data
export function getDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2));
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading DB:", error);
        return INITIAL_DATA;
    }
}

// Helper to write data
export function saveDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error("Error writing DB:", error);
        return false;
    }
}

// Helper to init DB (called on app start)
export function initDB() {
    getDB();
}
