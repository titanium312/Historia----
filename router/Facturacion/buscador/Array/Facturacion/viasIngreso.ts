import { Request, Response } from 'express';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface ListaItem {
    id: number;
    descripcion: string;
}

// ─────────────────────────────────────────────
// Vías de ingreso
// ─────────────────────────────────────────────
const viasIngreso: ListaItem[] = [
    { id: 1, descripcion: 'Demanda espontánea' },
    { id: 2, descripcion: 'Derivado de consulta externa' },
    { id: 3, descripcion: 'Derivado de urgencias' },
    { id: 4, descripcion: 'Derivado de hospitalización' },
    { id: 5, descripcion: 'Derivado de sala de cirugía' },
    { id: 6, descripcion: 'Derivado de sala de partos' },
    { id: 7, descripcion: 'Recién nacido en la institución' },
    { id: 8, descripcion: 'Recién nacido en otra institución' },
    { id: 9, descripcion: 'Derivado o referido de hospitalización domiciliaria' },
    { id: 10, descripcion: 'Derivado de atención domiciliaria' },
    { id: 11, descripcion: 'Derivado de telemedicina' },
    { id: 12, descripcion: 'Derivado de jornada de salud' },
    { id: 13, descripcion: 'Referido de otra institución' },
    { id: 14, descripcion: 'Contrarreferido de otra institución' }
];

// ─────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────
export const listarViasIngreso = (_req: Request, res: Response): void => {
    res.status(200).json({
        success: true,
        data: viasIngreso
    });
};