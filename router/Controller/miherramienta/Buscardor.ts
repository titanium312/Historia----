import { Request, Response } from 'express';
import axios from 'axios';
import * as querystring from 'querystring';

// -------------------------------------------------------------------
// 1. Configuración fija (usa variables de entorno en producción)
// -------------------------------------------------------------------
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IlJiYXJyZXRvIiwianRpIjoiYTY2NWRkYjItOGJkMi00MzI5LWI2MGUtMDUwOWMzNWU0MDQyIiwidXNlcm5hbWUiOiJSYmFycmV0byIsImVtYWlsIjoicmIucm9iZXJ0by5iYXJyZXRvQGdtYWlsLmNvbSIsImFkbWluIjoiTiIsInVzZXJpZCI6IjY4NzQiLCJpbnN0aXR1dGlvbiI6IjIwIiwicGFnb3MiOiIwIiwidmVyc2lvbiI6IjEuMC4wLjAiLCJlbnZpcm9ubWVudCI6IlByb2R1Y3Rpb24iLCJleHAiOjE3ODc4NjM1MzUsImlzcyI6InRlZ2V0dC5sb2dpbiIsImF1ZCI6InRlZ2V0dC5jb20ifQ.HGY52TK4wxrlTWVW9ELlybd7eN0blAQOMs5XsDu8jk4';

const COOKIES = [
  { name: '_ga', value: 'GA1.1.433661464.1772468883' },
  { name: 'twk_uuid_61e04197b84f7301d32ada9f', value: '%7B%22uuid%22%3A%221.Sx13ycH3BdSXIYC93nkLL7P8utiEspFsyRC6v3rFzyv77ldcjYzsfqXuaTaW6tP7MyONDncUjmMd30TSB8c9Dla5OxkxxYcDd40zCfLeLMuU9OX5R5TLE%22%2C%22version%22%3A3%2C%22domain%22%3A%22saludplus.co%22%2C%22ts%22%3A1773241450106%7D' },
  { name: '_clck', value: '2l4g58%5E2%5Eg8y%5E0%5E2252' },
  { name: '_ga_581YHK4S33', value: 'GS2.1.s1787861733%60o211%60g1%60t1787863517%60j59%60l0%60h0' },
  { name: '_clsk', value: '1htcdy1%5E1787863517441%5E8%5E1%5En.clarity.ms%2Fcollect' },
];

const FECHA_LIMITE = new Date(2025, 0, 1); // 2025-01-01

// -------------------------------------------------------------------
// 2. Función que llama a la API externa con todos los headers
// -------------------------------------------------------------------
async function llamarApiExterna(
  busqueda: string,
  fechaInicial: string,
  fechaFinal: string
): Promise<any> {
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
    sSearch: busqueda,   // aquí va el documento o número de admisión
    bRegex: 'false',
    sSearch_0: '',
    bRegex_0: 'false',
    bSearchable_0: 'true',
    sSearch_1: '',
    bRegex_1: 'false',
    bSearchable_1: 'false',
    sSearch_2: '',
    bRegex_2: 'false',
    bSearchable_2: 'false',
    sSearch_3: '',
    bRegex_3: 'false',
    bSearchable_3: 'false',
    sSearch_4: '',
    bRegex_4: 'false',
    bSearchable_4: 'false',
    sSearch_5: '',
    bRegex_5: 'false',
    bSearchable_5: 'false',
    sSearch_6: '',
    bRegex_6: 'false',
    bSearchable_6: 'false',
    sSearch_7: '',
    bRegex_7: 'false',
    bSearchable_7: 'false',
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
  const cookieString = COOKIES.map(c => `${c.name}=${c.value}`).join('; ');

  const url = `https://balance.saludplus.co/admisiones/BucardorAdmisionesDatos?fechaInicial=${encodeURIComponent(fechaInicial)}&fechaFinal=${encodeURIComponent(fechaFinal)}&idRecurso=0&SinCargo=False&idServicioIngreso=3&idCaracteristica=0&validarSede=True`;

  try {
    const response = await axios.post(url, encodedBody, {
      headers: {
        'authority': 'balance.saludplus.co',
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'es-419,es;q=0.9,en;q=0.8',
        'authorization': `Bearer ${TOKEN}`,
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookieString,
        // HEADER CRÍTICO: el mismo que usaste en el curl exitoso
        'data': 'RyYCH1Lu3RaWjAwjq79h9YnHmVGtZiiHoILsunKhJgM=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==',
        'origin': 'https://balance.saludplus.co',
        'priority': 'u=1, i',
        'referer': 'https://balance.saludplus.co/instituciones/?origen=1&theme=false&time=1787863516036',
        'sec-ch-ua': '"Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`Error al consultar la API: ${error.message}`);
  }
}

// -------------------------------------------------------------------
// 3. Controlador principal
// -------------------------------------------------------------------
export const buscarAdmision = async (req: Request, res: Response) => {
  try {
    // Leer el parámetro de búsqueda (puede ser documento o admisión)
    const busqueda = req.body.busqueda || req.query.busqueda || req.body.documento || req.query.documento;

    if (!busqueda) {
      return res.status(400).json({ error: 'El parámetro "busqueda" (documento o admisión) es obligatorio.' });
    }

    console.log(`🔍 Buscando: "${busqueda}"`);

    // Fechas por defecto: hoy y hoy - 6 meses
    const hoy = new Date();
    let fin = new Date(hoy);
    let ini = new Date(hoy);
    ini.setMonth(ini.getMonth() - 6);

    let todosLosRegistros: any[] = [];
    let intentos = 0;
    const MAX_INTENTOS = 20;

    while (intentos < MAX_INTENTOS) {
      const iniStr = `${(ini.getMonth() + 1).toString().padStart(2, '0')}/${ini.getDate().toString().padStart(2, '0')}/${ini.getFullYear()}`;
      const finStr = `${(fin.getMonth() + 1).toString().padStart(2, '0')}/${fin.getDate().toString().padStart(2, '0')}/${fin.getFullYear()}`;

      console.log(`📅 Consultando: ${iniStr} - ${finStr}`);

      try {
        const data = await llamarApiExterna(busqueda, iniStr, finStr);
        if (data.aaData && data.aaData.length > 0) {
          // Acumulamos todos los registros encontrados
          todosLosRegistros = todosLosRegistros.concat(data.aaData);
          console.log(`✅ Encontrados ${data.aaData.length} registros en este rango`);
        } else {
          console.log(`❌ Sin resultados en este rango`);
        }
      } catch (err) {
        console.warn(`⚠️ Error en consulta para ${iniStr}-${finStr}:`, err);
      }

      // Retroceder 6 meses
      const nuevoFin = new Date(ini);
      const nuevoIni = new Date(ini);
      nuevoIni.setMonth(nuevoIni.getMonth() - 6);

      // Si el nuevo inicio es anterior a la fecha límite, hacemos un último intento hasta la límite
      if (nuevoIni < FECHA_LIMITE) {
        if (nuevoFin >= FECHA_LIMITE) {
          const ultimoIni = new Date(FECHA_LIMITE);
          const ultimoIniStr = `${(ultimoIni.getMonth() + 1).toString().padStart(2, '0')}/${ultimoIni.getDate().toString().padStart(2, '0')}/${ultimoIni.getFullYear()}`;
          const ultimoFinStr = `${(nuevoFin.getMonth() + 1).toString().padStart(2, '0')}/${nuevoFin.getDate().toString().padStart(2, '0')}/${nuevoFin.getFullYear()}`;
          console.log(`📅 Último intento: ${ultimoIniStr} - ${ultimoFinStr}`);
          try {
            const data = await llamarApiExterna(busqueda, ultimoIniStr, ultimoFinStr);
            if (data.aaData && data.aaData.length > 0) {
              todosLosRegistros = todosLosRegistros.concat(data.aaData);
            }
          } catch (e) { /* ignorar */ }
        }
        break;
      }

      ini = nuevoIni;
      fin = nuevoFin;
      intentos++;
    }

    if (todosLosRegistros.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontraron admisiones para "${busqueda}" en el período disponible (desde 2025-01-01 hasta hoy).`
      });
    }

    // Eliminar duplicados por si el mismo registro aparece en varios rangos
    const registrosUnicos = Array.from(new Map(todosLosRegistros.map(item => [item[0], item])).values());

    res.json({
      success: true,
      total: registrosUnicos.length,
      data: registrosUnicos,
    });
  } catch (error: any) {
    console.error('❌ Error en controlador:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
};