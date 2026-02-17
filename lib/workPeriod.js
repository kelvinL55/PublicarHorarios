import { addMonths, subMonths, eachDayOfInterval, getDay } from 'date-fns';

/**
 * Obtiene el periodo laboral actual basado en una fecha de referencia.
 * El periodo laboral va del día 27 de un mes al día 26 del mes siguiente.
 * 
 * Reglas:
 * - Si la fecha es >= 27: El periodo es del 27 del mes actual al 26 del siguiente mes
 * - Si la fecha es <= 26: El periodo es del 27 del mes anterior al 26 del mes actual
 * 
 * @param {Date} referenceDate - Fecha de referencia (por defecto: hoy)
 * @returns {Object} { displayMonth: string (nombre del mes a mostrar), start: Date, end: Date }
 */
export function getCurrentWorkPeriod(referenceDate = new Date()) {
    const day = referenceDate.getDate();
    const month = referenceDate.getMonth();
    const year = referenceDate.getFullYear();

    let startDate, endDate, displayMonth;

    if (day >= 27) {
        // Periodo: 27 de este mes - 26 del siguiente mes
        startDate = new Date(year, month, 27);
        const nextMonth = addMonths(startDate, 1);
        endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 26);
        // Mostrar el mes siguiente
        displayMonth = nextMonth;
    } else {
        // Periodo: 27 del mes anterior - 26 de este mes
        const prevMonth = subMonths(referenceDate, 1);
        startDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 27);
        endDate = new Date(year, month, 26);
        // Mostrar el mes actual
        displayMonth = referenceDate;
    }

    return { displayMonth, start: startDate, end: endDate };
}

/**
 * Genera un array de fechas para un periodo laboral específico.
 * El periodo siempre va del día 27 al día 26 del mes siguiente.
 * 
 * @param {number} year - Año
 * @param {number} month - Mes (0-11, formato JavaScript)
 * @returns {Date[]} Array de fechas del periodo laboral
 */
export function getWorkPeriodDates(year, month) {
    // El periodo para el "Mes X" comienza el 27 del "Mes X-1"
    const startDate = new Date(year, month - 1, 27);
    const nextMonth = addMonths(startDate, 1);
    const endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 26);

    return eachDayOfInterval({ start: startDate, end: endDate });
}

/**
 * Navega al siguiente o anterior periodo laboral.
 * 
 * @param {Date} currentDisplayMonth - Mes que se está mostrando actualmente
 * @param {number} direction - 1 para siguiente, -1 para anterior
 * @returns {Date} Nueva fecha de display (mes a mostrar)
 */
export function navigateWorkPeriod(currentDisplayMonth, direction) {
    return direction > 0
        ? addMonths(currentDisplayMonth, 1)
        : subMonths(currentDisplayMonth, 1);
}

/**
 * Calcula estadísticas laborales para un empleado en un periodo específico.
 * 
 * @param {Array} employeeShifts - Array de turnos del empleado [{ date: 'YYYY-MM-DD', type: 'M'|'T'|'N'|'L' }]
 * @param {Date[]} periodDates - Array de fechas del periodo laboral
 * @returns {Object} { totalDays, workableDays, freeDays, workingDays }
 */
export function calculateWorkStatistics(employeeShifts, periodDates) {
    const totalDays = periodDates.length;

    // Contar días laborables (lunes a viernes)
    // getDay(): 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const workableDays = periodDates.filter(date => {
        const dayOfWeek = getDay(date);
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Lunes a Viernes
    }).length;

    // Contar días libres (turnos con tipo 'L')
    const freeDays = employeeShifts.filter(shift => shift.type === 'L').length;

    // Días trabajados = Total días - Días libres
    const workingDays = totalDays - freeDays;

    return {
        totalDays,
        workableDays,
        freeDays,
        workingDays
    };
}

/**
 * Formatea el periodo laboral para mostrar (ej: "Febrero 2026 (27 Ene - 26 Feb)")
 * 
 * @param {Date} start - Fecha de inicio del periodo
 * @param {Date} end - Fecha de fin del periodo
 * @param {Date} displayMonth - Mes a mostrar en el título
 * @param {Object} locale - Locale de date-fns (opcional)
 * @returns {string} String formateado del periodo
 */
export function formatWorkPeriod(start, end, displayMonth, locale) {
    const { format } = require('date-fns');

    const monthName = format(displayMonth, 'MMMM yyyy', { locale });
    const startStr = format(start, 'd MMM', { locale });
    const endStr = format(end, 'd MMM', { locale });

    return `${monthName} (${startStr} - ${endStr})`;
}
