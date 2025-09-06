import { initDatabase } from '../../../lib/database';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const db = initDatabase();
      const { fecha } = req.query;

      let query = `
        SELECT 
          c.id,
          c.expediente_id,
          c.fecha,
          c.hora_inicio,
          c.hora_fin,
          c.estado,
          c.notas,
          c.created_at,
          c.updated_at,
          e.cedula,
          e.paciente
        FROM citas c
        INNER JOIN expedientes e ON c.expediente_id = e.id
      `;

      let params = [];
      if (fecha) {
        query += ' WHERE c.fecha = ?';
        params.push(fecha);
      }

      query += ' ORDER BY c.fecha DESC, c.hora_inicio ASC';
      
      const citas = db.prepare(query).all(...params);
      
      return res.status(200).json(citas);
    }

    if (method === 'POST') {
      const { expediente_id, fecha, hora_inicio, hora_fin, notas } = req.body;
      const db = initDatabase();

      // Validar que no haya conflictos de horario
      const conflicto = db.prepare(`
        SELECT id FROM citas 
        WHERE fecha = ? 
        AND estado != 'cancelada'
        AND (
          (hora_inicio <= ? AND hora_fin > ?) OR
          (hora_inicio < ? AND hora_fin >= ?) OR
          (hora_inicio >= ? AND hora_fin <= ?)
        )
      `).get(fecha, hora_inicio, hora_inicio, hora_fin, hora_fin, hora_inicio, hora_fin);

      if (conflicto) {
        return res.status(400).json({ 
          error: 'Ya existe una cita programada en este horario' 
        });
      }

      // Verificar que el expediente existe
      const expediente = db.prepare('SELECT id FROM expedientes WHERE id = ?').get(expediente_id);
      if (!expediente) {
        return res.status(400).json({ 
          error: 'El expediente especificado no existe' 
        });
      }

      const stmt = db.prepare(`
        INSERT INTO citas (expediente_id, fecha, hora_inicio, hora_fin, notas)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(expediente_id, fecha, hora_inicio, hora_fin, notas || null);

      return res.status(200).json({ 
        id: result.lastInsertRowid,
        message: 'Cita creada exitosamente' 
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error in citas API:', error);
    return res.status(500).json({ error: 'Error procesando la solicitud' });
  }
}