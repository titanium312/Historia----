// src/controllers/armarJson.ts
import { Request, Response } from "express";
import { buscarIdAdmision } from "./1-buscarIdAdmision";
import { buscarDatosAdmision } from "./2-buscarDatosAdmision";
import { FacturasBuscar } from "./3-FacturasBuscar";

// ─────────────────────────────────────────────────────────────
// Helpers para normalizar formatos ASP.NET del upstream
// ─────────────────────────────────────────────────────────────

const RE_DOTNET_DATE = /^\/Date\((-?\d+)(?:[+-]\d+)?\)\/$/;

/** "/Date(1791262800000)/" → "06/10/2026" (DD/MM/YYYY, UTC) */
function parseDotNetDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.match(RE_DOTNET_DATE);
  if (!m) return null;
  const d = new Date(Number(m[1]));
  if (isNaN(d.getTime())) return null;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** TimeSpan de .NET ({ Hours, Minutes, Ticks... }) → "HH:mm" */
function parseTimeSpan(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const t = v as any;
  if (typeof t.Hours !== "number" || typeof t.Minutes !== "number") return null;
  if (!("Ticks" in t)) return null; // discriminador para no confundir objetos normales
  const hh = String(t.Hours).padStart(2, "0");
  const mm = String(t.Minutes).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Normaliza el objeto de una admisión (paso 2). No muta. */
function normalizarAdmision(item: any) {
  if (!item || typeof item !== "object") return item;
  const out: Record<string, any> = { ...item };
  for (const key of ["fecha_admision", "fecha_remision"] as const) {
    const parsed = parseDotNetDate(out[key]);
    if (parsed) out[key] = parsed;
  }
  for (const key of ["hora_admision", "hora_remision"] as const) {
    const parsed = parseTimeSpan(out[key]);
    if (parsed) out[key] = parsed;
  }
  return out;
}

/**
 * Normaliza recursivamente cualquier estructura (paso 3).
 * Recorre objetos y arrays, reemplazando:
 *   - "/Date(...)/"     → "DD/MM/YYYY"
 *   - { Hours, ... }    → "HH:mm"
 */
function normalizarProfundo(value: any): any {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    const d = parseDotNetDate(value);
    return d ?? value;
  }

  if (Array.isArray(value)) return value.map(normalizarProfundo);

  if (typeof value === "object") {
    const ts = parseTimeSpan(value);
    if (ts) return ts;

    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalizarProfundo(v);
    return out;
  }

  return value;
}

/**
 * Orquesta tres controllers:
 *   1) buscarIdAdmision    → { idAdmision, numeroAdmision, ... }
 *   2) buscarDatosAdmision → detalle de la admisión
 *   3) FacturasBuscar      → facturas asociadas a la admisión
 *
 * Body esperado: { numeroAdmision: string }
 */
export async function CombinarConsulta(req: Request, res: Response) {
  try {
    const { numeroAdmision } = req.body;

    if (!numeroAdmision) {
      return res.status(400).json({ error: "numeroAdmision es obligatorio" });
    }

    // ─────────────────────────────────────────────────────────
    // PASO 1: buscarIdAdmision → obtener idAdmision
    // ─────────────────────────────────────────────────────────
    let capturado1: any = null;
    let status1 = 200;

    const fakeRes1: any = {
      status(code: number) { status1 = code; return fakeRes1; },
      json(payload: any)    { capturado1 = payload; return fakeRes1; },
      send(payload: any)    { capturado1 = payload; return fakeRes1; },
      end()                 { return fakeRes1; },
    };
    const fakeReq1: any = {
      body: { valorBusqueda: numeroAdmision },
      query: {},
      params: {},
    };

    await buscarIdAdmision(fakeReq1, fakeRes1);

    if (status1 !== 200 || !capturado1?.success) {
      return res.status(status1 || 500).json({
        error: "No se pudo obtener la admisión desde buscarIdAdmision",
        detalle: capturado1,
      });
    }

    const idAdmision = capturado1?.data?.idAdmision;
    if (!idAdmision) {
      return res.status(404).json({
        error: "buscarIdAdmision no devolvió idAdmision",
        detalle: capturado1,
      });
    }

    // ─────────────────────────────────────────────────────────
    // PASO 2: buscarDatosAdmision usando idAdmision
    // ─────────────────────────────────────────────────────────
    let capturado2: any = null;
    let status2 = 200;

    const fakeRes2: any = {
      status(code: number) { status2 = code; return fakeRes2; },
      json(payload: any)    { capturado2 = payload; return fakeRes2; },
      send(payload: any)    { capturado2 = payload; return fakeRes2; },
      end()                 { return fakeRes2; },
    };
    const fakeReq2: any = {
      query: { idAdmision: String(idAdmision) },
      body: {},
      params: {},
    };

    await buscarDatosAdmision(fakeReq2, fakeRes2);

    const datosNormalizados =
      status2 === 200
        ? Array.isArray(capturado2)
          ? capturado2.map(normalizarAdmision)
          : normalizarAdmision(capturado2)
        : null;

    // ─────────────────────────────────────────────────────────
    // PASO 3: FacturasBuscar usando idAdmision
    // ─────────────────────────────────────────────────────────
    let capturado3: any = null;
    let status3 = 200;

    const fakeRes3: any = {
      status(code: number) { status3 = code; return fakeRes3; },
      json(payload: any)    { capturado3 = payload; return fakeRes3; },
      send(payload: any)    { capturado3 = payload; return fakeRes3; },
      end()                 { return fakeRes3; },
    };
    const fakeReq3: any = {
      query: { idAdmision: String(idAdmision) },
      params: {},
      body: {},
    };

    await FacturasBuscar(fakeReq3, fakeRes3);

    const facturasNormalizadas = status3 === 200 ? normalizarProfundo(capturado3) : null;

    // ─────────────────────────────────────────────────────────
    // Respuesta final
    // ─────────────────────────────────────────────────────────
    return res.json({
      message: "hola",
      numeroAdmision,
      idAdmision,
      admision: capturado1?.data,
      datos: datosNormalizados,
      facturas: facturasNormalizadas,
      ...(status2 !== 200 || status3 !== 200
        ? {
            errores: {
              ...(status2 !== 200 && { buscarDatosAdmision: capturado2 }),
              ...(status3 !== 200 && { facturasBuscar: capturado3 }),
            },
          }
        : {}),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[armarJson]", msg);
    return res.status(500).json({ error: "Internal error", detalle: msg });
  }
}