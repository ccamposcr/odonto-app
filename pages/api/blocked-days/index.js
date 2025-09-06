const { initDatabase } = require('../../../lib/database');

export default function handler(req, res) {
  const db = initDatabase();

  if (req.method === 'GET') {
    try {
      const blockedDays = db.prepare('SELECT fecha FROM blocked_days ORDER BY fecha').all();
      const dates = blockedDays.map(day => day.fecha);
      res.status(200).json(dates);
    } catch (error) {
      console.error('Error fetching blocked days:', error);
      res.status(500).json({ error: 'Error al obtener los días bloqueados' });
    }
  } else if (req.method === 'POST') {
    try {
      const { fecha } = req.body;
      
      if (!fecha) {
        return res.status(400).json({ error: 'Fecha es requerida' });
      }

      // Verificar formato de fecha
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({ error: 'Formato de fecha inválido (YYYY-MM-DD)' });
      }

      const insertStmt = db.prepare('INSERT INTO blocked_days (fecha) VALUES (?)');
      insertStmt.run(fecha);
      
      res.status(201).json({ message: 'Día bloqueado exitosamente' });
    } catch (error) {
      console.error('Error blocking day:', error);
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(409).json({ error: 'El día ya está bloqueado' });
      } else {
        res.status(500).json({ error: 'Error al bloquear el día' });
      }
    }
  } else if (req.method === 'DELETE') {
    try {
      const { fecha } = req.body;
      
      if (!fecha) {
        return res.status(400).json({ error: 'Fecha es requerida' });
      }

      const deleteStmt = db.prepare('DELETE FROM blocked_days WHERE fecha = ?');
      const result = deleteStmt.run(fecha);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'El día no estaba bloqueado' });
      }
      
      res.status(200).json({ message: 'Día desbloqueado exitosamente' });
    } catch (error) {
      console.error('Error unblocking day:', error);
      res.status(500).json({ error: 'Error al desbloquear el día' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).json({ error: 'Método no permitido' });
  }
}