const { initDatabase } = require('../../lib/database');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const db = initDatabase();
  
  try {
    // Obtener la última actualización de citas
    const lastCitaUpdate = db.prepare(`
      SELECT MAX(updated_at) as last_update 
      FROM citas
    `).get();

    // Obtener la última actualización de días bloqueados
    const lastBlockedDayUpdate = db.prepare(`
      SELECT MAX(created_at) as last_update 
      FROM blocked_days
    `).get();

    const response = {
      citas_last_update: lastCitaUpdate?.last_update || null,
      blocked_days_last_update: lastBlockedDayUpdate?.last_update || null,
      server_time: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ error: 'Error al obtener el estado de sincronización' });
  }
}