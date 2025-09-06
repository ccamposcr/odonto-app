const { initDatabase } = require('../../../lib/database');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send(`
      <html>
        <head>
          <title>Error - Clínica Dental</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Token inválido</h1>
          <p>El enlace no es válido o ha expirado.</p>
        </body>
      </html>
    `);
  }

  const db = initDatabase();
  
  try {
    // Verificar el token y obtener la información de la cita
    const request = db.prepare(`
      SELECT pr.*, c.fecha, c.hora_inicio, c.hora_fin, c.notas, e.paciente, e.cedula
      FROM patient_requests pr
      JOIN citas c ON pr.cita_id = c.id
      JOIN expedientes e ON c.expediente_id = e.id
      WHERE pr.token = ? AND pr.request_type = 'cancel' AND pr.status = 'pending'
    `).get(token);

    if (!request) {
      return res.status(404).send(`
        <html>
          <head>
            <title>Enlace No Válido - Clínica Dental</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f9fafb; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .error { color: #dc2626; }
              .logo { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">🦷</div>
              <h1 class="error">Enlace No Válido</h1>
              <p>El enlace de cancelación no es válido, ha expirado o ya fue procesado.</p>
              <p>Si necesita cancelar su cita, por favor contacte directamente a la clínica.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Verificar si ha expirado
    if (new Date() > new Date(request.expires_at)) {
      return res.status(410).send(`
        <html>
          <head>
            <title>Enlace Expirado - Clínica Dental</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f9fafb; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .error { color: #dc2626; }
              .logo { font-size: 48px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">🦷</div>
              <h1 class="error">Enlace Expirado</h1>
              <p>El enlace de cancelación ha expirado.</p>
              <p>Por favor contacte directamente a la clínica para cancelar su cita.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Marcar la solicitud como procesada
    db.prepare('UPDATE patient_requests SET status = ? WHERE id = ?')
      .run('processed', request.id);

    // Agregar un estado especial a la cita
    db.prepare('UPDATE citas SET estado = ? WHERE id = ?')
      .run('cancelacion_solicitada', request.cita_id);

    const formatDate = (dateStr) => {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (timeStr) => {
      const time24 = timeStr.substring(0, 5);
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${minutes} ${ampm}`;
    };

    res.status(200).send(`
      <html>
        <head>
          <title>Solicitud de Cancelación Recibida - Clínica Dental</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background-color: #f9fafb; 
              margin: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              padding: 40px; 
              border-radius: 12px; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            }
            .logo { font-size: 48px; margin-bottom: 20px; }
            .success { color: #059669; }
            .appointment-card {
              background-color: #fef7ff;
              border: 2px solid #e879f9;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: left;
            }
            .highlight { color: #0f766e; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🦷</div>
            <h1 class="success">Solicitud de Cancelación Recibida</h1>
            
            <p>Estimado/a <span class="highlight">${request.paciente}</span>,</p>
            
            <p>Hemos recibido su solicitud de cancelación para la siguiente cita:</p>
            
            <div class="appointment-card">
              <h3>📅 Cita a Cancelar:</h3>
              <p><strong>Fecha:</strong> ${formatDate(request.fecha)}</p>
              <p><strong>Hora:</strong> ${formatTime(request.hora_inicio)} - ${formatTime(request.hora_fin)}</p>
              <p><strong>Paciente:</strong> ${request.paciente}</p>
              <p><strong>Cédula:</strong> ${request.cedula}</p>
              ${request.notas ? `<p><strong>Notas:</strong> ${request.notas}</p>` : ''}
            </div>
            
            <p><strong>Su solicitud está siendo procesada.</strong></p>
            <p>El personal de la clínica revisará su solicitud y se comunicará con usted para confirmar la cancelación.</p>
            
            <p><small>Esta ventana se puede cerrar. Recibirá una confirmación por correo electrónico cuando su solicitud sea procesada.</small></p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing cancel request:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Error - Clínica Dental</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">Error del Servidor</h1>
          <p>Ocurrió un error al procesar su solicitud. Por favor contacte a la clínica.</p>
        </body>
      </html>
    `);
  }
}