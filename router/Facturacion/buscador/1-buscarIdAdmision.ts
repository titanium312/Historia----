// src/buscador/buscarIdAdmision.ts

import axios, { AxiosResponse } from 'axios';
import * as querystring from 'querystring';
import { Request, Response } from 'express';

/**
 * Fila cruda que devuelve el upstream (aaData).
 * Mapeo confirmado contra respuesta real:
 *   [0] idAdmision
 *   [1] numeroAdmision
 *   [2] documento        ("TI 1066521184")
 *   [3] nombrePaciente
 *   [4] entidad
 *   [5] fechaAdmision    (MM/DD/YYYY)
 *   [6] horaAdmision     (HH:mm)
 *   [7] estado           (puede venir "")
 *   [8] flag             (no declarado en sColumns; valor "0" en el ejemplo)
 */
export type BuscadorFila = [
  string | number, // [0] idAdmision
  string,          // [1] numeroAdmision
  string,          // [2] documento
  string,          // [3] nombrePaciente
  string,          // [4] entidad
  string,          // [5] fechaAdmision
  string,          // [6] horaAdmision
  string,          // [7] estado
  ...unknown[]     // [8+] extras no declarados
];

export interface AdmisionNombrada {
  idAdmision: string;
  numeroAdmision: string;
  documento: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombrePaciente: string;
  entidad: string;
  fechaAdmision: string;
  horaAdmision: string;
  estado: string;
  flag: string; // [8] campo extra no documentado en sColumns
}

interface BuscadorResponse {
  aaData: BuscadorFila[];
}

const TOKEN_JWT = '<JWT>';
const TOKEN_DATA =
  'RyYCH1Lu3RaWjAwjq79h9YnHmVGtZiiHoILsunKhJgM=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==';

const COOKIES = [
  { name: '_ga', value: 'GA1.1.433661464.1772468883' },
  { name: 'twk_uuid_61e04197b84f7301d32ada9f', value: '<...>' },
  { name: '_clck', value: '2l4g58%5E2%5Eg8y%5E0%5E2252' },
  { name: '_ga_581YHK4S33', value: 'GS2.1.s1787861733%60o211%60g1%60t1787863517%60j59%60l0%60h0' },
  { name: '_clsk', value: '1htcdy1%5E1787863517441%5E8%5E1%5En.clarity.ms%2Fcollect' },
];

const API_BASE_URL: string =
  process.env.API_BASE_URL || 'https://balance.saludplus.co';
const FECHA_LIMITE = new Date(2025, 0, 1);

/**
 * Convierte la fila cruda del upstream a un objeto con campos nombrados.
 */
function mapearFilaAdmision(fila: BuscadorFila): AdmisionNombrada {
  const documentoRaw = String(fila[2] ?? '').trim();
  const match = documentoRaw.match(/^([A-Z]+)\s+(.+)$/);

  return {
    idAdmision:      String(fila[0] ?? '').trim(),
    numeroAdmision:  String(fila[1] ?? '').trim(),
    documento:       documentoRaw,
    tipoDocumento:   match ? match[1] : '',
    numeroDocumento: match ? match[2].trim() : documentoRaw,
    nombrePaciente:  String(fila[3] ?? '').trim(),
    entidad:         String(fila[4] ?? '').trim(),
    fechaAdmision:   String(fila[5] ?? '').trim(),
    horaAdmision:    String(fila[6] ?? '').trim(),
    estado:          String(fila[7] ?? '').trim(),
    flag:            String(fila[8] ?? '').trim(),
  };
}

async function peticionConFechas(
  valorBusqueda: string,
  fechaInicial: Date,
  fechaFinal: Date
): Promise<BuscadorFila[]> {
  const iniStr = `${(fechaInicial.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${fechaInicial
    .getDate()
    .toString()
    .padStart(2, '0')}/${fechaInicial.getFullYear()}`;
  const finStr = `${(fechaFinal.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${fechaFinal
    .getDate()
    .toString()
    .padStart(2, '0')}/${fechaFinal.getFullYear()}`;

  const bodyParams = {
    sEcho: '2',
    iColumns: '8',
    sColumns: ',CODIGO,DOCUMENTO,NOMBRE,Entidad,FECHA,HORA,ESTADO',
    iDisplayStart: '0',
    iDisplayLength: '10',
    mDataProp_0: '0',
    mDataProp_1: '1',
    mDataProp_2: '2',
    mDataProp_3: '3',
    mDataProp_4: '4',
    mDataProp_5: '5',
    mDataProp_6: '6',
    mDataProp_7: '7',
    sSearch: valorBusqueda,
    bRegex: 'false',
    sSearch_0: '', bRegex_0: 'false', bSearchable_0: 'true',
    sSearch_1: '', bRegex_1: 'false', bSearchable_1: 'false',
    sSearch_2: '', bRegex_2: 'false', bSearchable_2: 'false',
    sSearch_3: '', bRegex_3: 'false', bSearchable_3: 'false',
    sSearch_4: '', bRegex_4: 'false', bSearchable_4: 'false',
    sSearch_5: '', bRegex_5: 'false', bSearchable_5: 'false',
    sSearch_6: '', bRegex_6: 'false', bSearchable_6: 'false',
    sSearch_7: '', bRegex_7: 'false', bSearchable_7: 'false',
    iSortingCols: '1',
    iSortCol_0: '0',
    sSortDir_0: 'asc',
    bSortable_0: 'true',
    bSortable_1: 'false',
    bSortable_2: 'false',
    bSortable_3: 'false',
    bSortable_4: 'false',
    bSortable_5: 'false',
    bSortable_6: 'false',
    bSortable_7: 'false',
  };

  const encodedBody = querystring.stringify(bodyParams);
  const cookieString = COOKIES.map((c) => `${c.name}=${c.value}`).join('; ');
  const url = `${API_BASE_URL}/admisiones/BucardorAdmisionesDatos?fechaInicial=${encodeURIComponent(
    iniStr
  )}&fechaFinal=${encodeURIComponent(
    finStr
  )}&idRecurso=0&SinCargo=False&idServicioIngreso=3&idCaracteristica=0&validarSede=True`;

  try {
    const response: AxiosResponse<BuscadorResponse> = await axios.post(
      url,
      encodedBody,
      {
        headers: {
          authority: 'balance.saludplus.co',
          accept: 'application/json, text/javascript, */*; q=0.01',
          'content-type': 'application/x-www-form-urlencoded',
          cookie: cookieString,
          data: TOKEN_DATA,
          origin: 'https://balance.saludplus.co',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'x-requested-with': 'XMLHttpRequest',
        },
      }
    );

    return response.data?.aaData || [];
  } catch (error: any) {
    console.warn(
      `❌ Error en peticiónConFechas (${iniStr} - ${finStr}):`,
      error.message
    );
    return [];
  }
}

/**
 * Busca una admisión por número de admisión o por documento
 * (modo automático: prueba ambos).
 *
 * Devuelve la admisión ya nombrada (objeto), no el array crudo.
 */
export async function consultarBuscadorExterno(
  valorBusqueda: string | number
): Promise<AdmisionNombrada> {
  const busquedaStr = String(valorBusqueda).trim();
  if (!busquedaStr) {
    throw new Error('El campo "valorBusqueda" es requerido');
  }

  const hoy = new Date();
  let fin = new Date(hoy);
  let ini = new Date(hoy);
  ini.setMonth(ini.getMonth() - 6);

  let todosLosRegistros: BuscadorFila[] = [];
  let intentos = 0;
  const MAX_INTENTOS = 30;

  const busquedaNumerica = busquedaStr.replace(/\D/g, '');

  while (intentos < MAX_INTENTOS) {
    const registros = await peticionConFechas(busquedaStr, ini, fin);

    if (registros.length > 0) {
      const encontrado = registros.find((f) => {
        const numAdm = String(f[1] || '').split(/\s+/)[0];
        const doc = String(f[2] || '').replace(/\D/g, '');
        return numAdm === busquedaStr || (busquedaNumerica && doc === busquedaNumerica);
      });

      if (encontrado) return mapearFilaAdmision(encontrado);
      todosLosRegistros = todosLosRegistros.concat(registros);
    }

    const nuevoFin = new Date(ini);
    const nuevoIni = new Date(ini);
    nuevoIni.setMonth(nuevoIni.getMonth() - 6);

    if (nuevoIni < FECHA_LIMITE) {
      if (nuevoFin >= FECHA_LIMITE) {
        const ultimoIni = new Date(FECHA_LIMITE);
        const ultimosRegistros = await peticionConFechas(
          busquedaStr,
          ultimoIni,
          nuevoFin
        );
        if (ultimosRegistros.length > 0) {
          todosLosRegistros = todosLosRegistros.concat(ultimosRegistros);
        }
      }
      break;
    }

    ini = nuevoIni;
    fin = nuevoFin;
    intentos++;
  }

  if (todosLosRegistros.length === 0) {
    throw new Error(`No se encontraron registros para "${valorBusqueda}".`);
  }

  const registrosUnicos = Array.from(
    new Map(todosLosRegistros.map((item) => [item[0], item])).values()
  );

  return mapearFilaAdmision(registrosUnicos[0]);
}

/**
 * Handler Express para POST /buscarIdAdmision
 *
 * Body / query / params aceptados:
 *   - valorBusqueda  (requerido) número de admisión o documento
 *
 * Respuesta:
 *   { success: true, data: { idAdmision, numeroAdmision, documento,
 *     tipoDocumento, numeroDocumento, nombrePaciente, entidad,
 *     fechaAdmision, horaAdmision, estado, flag } }
 */
export const buscarIdAdmision = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const valor =
      req.body?.valorBusqueda ??
      req.query?.valorBusqueda ??
      req.params?.valorBusqueda;

    if (!valor) {
      res.status(400).json({
        success: false,
        error:
          'Debe proporcionar el parámetro "valorBusqueda" (número de admisión o documento).',
      });
      return;
    }

    const admision = await consultarBuscadorExterno(String(valor).trim());

    res.status(200).json({ success: true, data: admision });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};