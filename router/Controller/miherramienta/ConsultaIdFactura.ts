import axios from 'axios';
import { Request, Response } from 'express';

// -------------------------------------------------------------------
// Token fijo (el header `data` que usa SaludPlus)
// -------------------------------------------------------------------
const TOKEN_FIJO =
  'RyYCH1Lu3RaWjAwjq79h9YnHmVGtZiiHoILsunKhJgM=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==';

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------
export interface ConsultaIdFacturaResult {
  idFactura: string;
  numeroFactura: string;
  infoCompleta: string;
}

interface FacturaApiResponse {
  aaData?: string[][];
  [key: string]: any;
}

// -------------------------------------------------------------------
// Función de negocio (token por defecto = TOKEN_FIJO)
// -------------------------------------------------------------------
export const ConsultaIdFactura = async (
  documento: string | number,
  token: string = TOKEN_FIJO
): Promise<ConsultaIdFacturaResult> => {
  try {
    if (!documento) {
      throw new Error('El campo "documento" es requerido');
    }

    const cookies: string[] = [
      '_ga=GA1.1.1028655100.1772306648',
      '_clck=14vh75i%5E2%5Eg4k%5E0%5E2250',
    ];

    const headers: Record<string, string> = {
      'authority': 'balance.saludplus.co',
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'es-419,es;q=0.9,en;q=0.8',
      'cache': 'true',
      'data': token,
      'origin': 'https://balance.saludplus.co',
      'referer': 'https://balance.saludplus.co/instituciones/',
      'x-requested-with': 'XMLHttpRequest',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cookie': cookies.join('; '),
    };

    const bodyData = new URLSearchParams({
      sEcho: '2',
      iColumns: '8',
      sColumns: ',CHECK,NUMERO,FECHA,RESOLUCION,PACIENTE,ENTIDAD,ESTADO',
      iDisplayStart: '0',
      iDisplayLength: '10',
      sSearch: documento.toString(),
      iSortingCols: '1',
      iSortCol_0: '0',
      sSortDir_0: 'asc',
    });

    const response = await axios<FacturaApiResponse>({
      method: 'POST',
      url: 'https://balance.saludplus.co/facturasAdministar/BuscarListadofacturasDatos',
      params: {
        fechaInicial: '01/01/2024',
        fechaFinal: '12/31/2026',
        idEntidad: '0',
        idContrato: '0',
        SinNumero: 'False',
        duplicadas: 'False',
        idCuentaCobro: '0',
        estadoFacturacionElectronica: '0',
      },
      headers,
      data: bodyData.toString(),
      timeout: 30000,
    });

    if (response.data && response.data.aaData && response.data.aaData.length > 0) {
      const registroEncontrado = response.data.aaData.find(
        (factura: string[]) =>
          factura[2] && factura[2].includes(documento.toString())
      );

      if (registroEncontrado) {
        const numeroFacturaCompleto: string = registroEncontrado[2];
        const partes = numeroFacturaCompleto.split(' - ');

        return {
          idFactura: registroEncontrado[0],
          numeroFactura: partes[1] || partes[0],
          infoCompleta: numeroFacturaCompleto,
        };
      } else {
        throw new Error(
          `No se encontró factura activa para el documento: ${documento}`
        );
      }
    } else {
      throw new Error('La consulta de facturas no devolvió resultados');
    }
  } catch (error: any) {
    const errorMsg = error.response
      ? `Error API Facturas (${error.response.status})`
      : error.message;
    console.error('Error en ConsultaIdFactura:', errorMsg);
    throw new Error(errorMsg);
  }
};

// -------------------------------------------------------------------
// Controlador Express (ya NO pide token)
// -------------------------------------------------------------------
export const ConsultaIdFacturaController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const documento = req.query.documento || req.body?.documento;

    if (!documento) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro "documento" es obligatorio.',
      });
    }

    console.log(`🔍 Consultando factura para documento: ${documento}`);

    const resultado = await ConsultaIdFactura(documento as string);

    return res.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error('❌ Error en ConsultaIdFacturaController:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
    });
  }
};