import { Request, Response, Router } from 'express';
import { MongoClient, ObjectId } from 'mongodb';

// ================================================================
// CONEXIÓN A MONGODB - CON TUS CREDENCIALES REALES
// ================================================================
const MONGO_URI =
  'mongodb+srv://rbrobertobarreto_db_user:mKDc0feSLGpj8fUC@cluster0.3bhv3kc.mongodb.net/?ssl=true&authSource=admin';

const DB_NAME = 'sample_mflix';
const COLLECTION_NAME = 'tablas_anidadas';

let client: MongoClient | null = null;
let collection: any;

async function getCollection() {
  if (!client) {
    try {
      console.log('⏳ Conectando a MongoDB...');
      client = new MongoClient(MONGO_URI);
      await client.connect();
      console.log('✅ Conectado a MongoDB Atlas');
      const db = client.db(DB_NAME);
      collection = db.collection(COLLECTION_NAME);
    } catch (error: any) {
      console.error('❌ Error conectando a MongoDB:', error.message);
      throw new Error(`No se pudo conectar a MongoDB: ${error.message}`);
    }
  }
  return collection;
}

// ================================================================
// CONTROLADOR ÚNICO
// ================================================================
export const handleAll = async (req: Request, res: Response) => {
  try {
    await getCollection();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error de conexión a la base de datos',
      details: error.message,
    });
  }

  const coll = await getCollection();
  const method = req.method.toUpperCase();

  // --- GET ---
  if (method === 'GET') {
    try {
      const { id, estado, fecha, limit = 10, page = 1 } = req.query;

      if (id) {
        if (!ObjectId.isValid(id as string)) {
          return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        const result = await coll.findOne({ _id: new ObjectId(id as string) });
        if (!result) return res.status(404).json({ success: false, message: 'No encontrado' });
        return res.status(200).json({ success: true, data: result });
      }

      const filter: any = {};
      if (estado) filter.estado = estado;
      if (fecha) filter.fecha = fecha;

      const skip = (Number(page) - 1) * Number(limit);
      const results = await coll.find(filter).sort({ _id: -1 }).skip(skip).limit(Number(limit)).toArray();
      const total = await coll.countDocuments(filter);

      return res.status(200).json({
        success: true,
        data: results,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error('GET error:', error);
      return res.status(500).json({ success: false, message: 'Error en GET', details: error.message });
    }
  }

  // --- POST ---
  if (method === 'POST') {
    try {
      const { numeroadmicion, fecha, hora, detalle, estado } = req.body;
      if (!numeroadmicion || !fecha || !hora || !detalle || !estado) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos: numeroadmicion, fecha, hora, detalle, estado',
        });
      }
      const nuevo = { numeroadmicion, fecha, hora, detalle, estado };
      const result = await coll.insertOne(nuevo);
      return res.status(201).json({
        success: true,
        message: 'Insertado',
        data: { _id: result.insertedId, ...nuevo },
      });
    } catch (error: any) {
      console.error('POST error:', error);
      return res.status(500).json({ success: false, message: 'Error en POST', details: error.message });
    }
  }

  // --- PUT ---
  if (method === 'PUT') {
    try {
      const { id } = req.query;
      const updates = req.body;
      if (!id) return res.status(400).json({ success: false, message: 'Falta ?id=xxx en la URL' });
      if (!ObjectId.isValid(id as string)) return res.status(400).json({ success: false, message: 'ID inválido' });

      const permitidos = ['numeroadmicion', 'fecha', 'hora', 'detalle', 'estado'];
      const updateData: any = {};
      for (const key of permitidos) {
        if (updates[key] !== undefined) updateData[key] = updates[key];
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
      }

      const result = await coll.updateOne({ _id: new ObjectId(id as string) }, { $set: updateData });
      if (result.matchedCount === 0) return res.status(404).json({ success: false, message: 'No encontrado' });
      return res.status(200).json({
        success: true,
        message: 'Actualizado',
        modifiedCount: result.modifiedCount,
      });
    } catch (error: any) {
      console.error('PUT error:', error);
      return res.status(500).json({ success: false, message: 'Error en PUT', details: error.message });
    }
  }

  // --- DELETE ---
  if (method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: 'Falta ?id=xxx en la URL' });
      if (!ObjectId.isValid(id as string)) return res.status(400).json({ success: false, message: 'ID inválido' });

      const result = await coll.deleteOne({ _id: new ObjectId(id as string) });
      if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'No encontrado' });
      return res.status(200).json({
        success: true,
        message: 'Eliminado',
        deletedCount: result.deletedCount,
      });
    } catch (error: any) {
      console.error('DELETE error:', error);
      return res.status(500).json({ success: false, message: 'Error en DELETE', details: error.message });
    }
  }

  return res.status(405).json({ success: false, message: `Método ${method} no permitido` });
};
