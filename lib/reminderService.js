const { initDatabase } = require('./database');
const { sendReminderEmail } = require('./emailService');
const crypto = require('crypto');

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const createPatientRequest = (citaId, requestType, token) => {
  const db = initDatabase();
  
  // Token válido por 7 días
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  return db.prepare(`
    INSERT INTO patient_requests (cita_id, token, request_type, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(citaId, token, requestType, expiresAt.toISOString());
};

const scheduleReminder = async (citaId) => {
  const db = initDatabase();
  
  try {
    // Obtener información de la cita y paciente
    const cita = db.prepare(`
      SELECT c.*, e.paciente, e.cedula, e.email
      FROM citas c
      JOIN expedientes e ON c.expediente_id = e.id
      WHERE c.id = ?
    `).get(citaId);

    if (!cita || !cita.email) {
      console.log('No email found for appointment reminder:', citaId);
      return { success: false, error: 'No email address' };
    }

    // Verificar si la cita es mañana
    const citaDate = new Date(cita.fecha + 'T00:00:00');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (citaDate.getTime() !== tomorrow.getTime()) {
      console.log('Appointment is not tomorrow, skipping reminder');
      return { success: false, error: 'Appointment is not tomorrow' };
    }

    // Generar tokens para cancelar y reagendar
    const cancelToken = generateToken();
    const rescheduleToken = generateToken();

    // Crear registros de solicitudes
    createPatientRequest(citaId, 'cancel', cancelToken);
    createPatientRequest(citaId, 'reschedule', rescheduleToken);

    // Enviar email de recordatorio (usaremos el token de cancelación como referencia)
    const result = await sendReminderEmail(cita, cancelToken);
    
    return result;
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return { success: false, error: error.message };
  }
};

const processReminders = async () => {
  const db = initDatabase();
  
  try {
    // Obtener todas las citas para mañana que no están canceladas
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const appointments = db.prepare(`
      SELECT c.*, e.paciente, e.cedula, e.email
      FROM citas c
      JOIN expedientes e ON c.expediente_id = e.id
      WHERE c.fecha = ? 
        AND c.estado NOT IN ('cancelada', 'cancelacion_solicitada')
        AND e.email IS NOT NULL
        AND e.email != ''
    `).all(tomorrowStr);

    console.log(`Processing ${appointments.length} reminders for ${tomorrowStr}`);

    const results = [];
    for (const appointment of appointments) {
      // Verificar si ya se envió recordatorio
      const existingRequest = db.prepare(`
        SELECT id FROM patient_requests 
        WHERE cita_id = ? AND request_type = 'cancel' 
        AND DATE(created_at) = DATE('now')
      `).get(appointment.id);

      if (!existingRequest) {
        const result = await scheduleReminder(appointment.id);
        results.push({
          appointmentId: appointment.id,
          patient: appointment.paciente,
          ...result
        });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error processing reminders:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateToken,
  createPatientRequest,
  scheduleReminder,
  processReminders
};