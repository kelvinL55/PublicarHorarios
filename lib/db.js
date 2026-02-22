import fs from 'fs';
import path from 'path';

// Definir la ruta al archivo JSON
const DB_PATH = path.join(process.cwd(), 'data.json');

// Datos iniciales si el archivo no existe
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

// Función auxiliar para leer datos
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

// Función auxiliar para escribir datos
export function saveDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error("Error writing DB:", error);
        return false;
    }
}

// Función auxiliar para inicializar la BD (llamada al iniciar la app)
export function initDB() {
    getDB();
}
