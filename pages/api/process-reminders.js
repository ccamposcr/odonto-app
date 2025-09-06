const { processReminders } = require('../../lib/reminderService');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar que la solicitud viene de un cron job o tiene autorización
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const result = await processReminders();
    
    if (result.success) {
      return res.status(200).json({
        message: 'Recordatorios procesados exitosamente',
        results: result.results
      });
    } else {
      return res.status(500).json({
        error: 'Error procesando recordatorios',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error in process-reminders API:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}