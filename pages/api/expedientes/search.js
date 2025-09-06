import { initDatabase } from '../../../lib/database';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const { q } = req.query;
      const db = initDatabase();

      if (!q || q.trim().length < 2) {
        return res.status(200).json([]);
      }

      const searchTerm = `%${q.trim()}%`;
      
      const expedientes = db.prepare(`
        SELECT id, cedula, paciente, telefono, email
        FROM expedientes 
        WHERE archivado = 0 
        AND (
          cedula LIKE ? OR 
          paciente LIKE ?
        )
        ORDER BY paciente ASC
        LIMIT 20
      `).all(searchTerm, searchTerm);
      
      return res.status(200).json(expedientes);
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error in expedientes search API:', error);
    return res.status(500).json({ error: 'Error procesando la solicitud' });
  }
}