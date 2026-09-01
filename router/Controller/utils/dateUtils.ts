// src/utils/dateUtils.ts

/**
 * Parsea una fecha en formato /Date(ticks)/ (ASP.NET JSON) a Date
 */
export function parseMicrosoftDate(fecha: any): Date | null {
    if (!fecha) return null;
    if (typeof fecha === 'string' && fecha.startsWith('/Date(') && fecha.endsWith(')/')) {
        const ticks = parseInt(fecha.slice(6, -2), 10);
        if (!isNaN(ticks)) {
            return new Date(ticks);
        }
    }
    if (fecha instanceof Date) return fecha;
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * Soporta fechas en formato Date, string ISO, o /Date(ticks)/
 */
export function calcularEdad(fechaNacimiento: any): number | null {
    const fecha = parseMicrosoftDate(fechaNacimiento);
    if (!fecha) return null;

    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
        edad--;
    }
    return edad >= 0 ? edad : null;
}