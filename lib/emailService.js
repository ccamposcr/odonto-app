const nodemailer = require('nodemailer');

// Configuración del transporter (usar variables de entorno en producción)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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

const getEmailTemplate = (type, data) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  const commonStyles = `
    <style>
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f9fafb;
        padding: 20px;
      }
      .email-header {
        background: linear-gradient(135deg, #0f766e, #0d9488);
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 12px 12px 0 0;
      }
      .logo {
        width: 60px;
        height: 60px;
        background-color: white;
        border-radius: 50%;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #0f766e;
        font-weight: bold;
      }
      .email-body {
        background-color: white;
        padding: 30px;
        border-radius: 0 0 12px 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .appointment-card {
        background-color: #f0fdfa;
        border: 2px solid #5eead4;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        margin: 10px 5px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        text-align: center;
        transition: all 0.3s ease;
      }
      .btn-primary {
        background-color: #0f766e;
        color: white;
      }
      .btn-primary:hover {
        background-color: #0d9488;
      }
      .btn-secondary {
        background-color: #6b7280;
        color: white;
      }
      .btn-danger {
        background-color: #dc2626;
        color: white;
      }
      .footer {
        text-align: center;
        color: #6b7280;
        font-size: 12px;
        margin-top: 30px;
        padding: 20px;
      }
      .highlight {
        color: #0f766e;
        font-weight: 600;
      }
    </style>
  `;

  if (type === 'confirmation') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmación de Cita - Clínica Dental</title>
        ${commonStyles}
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div class="logo">🦷</div>
            <h1>Clínica Dental</h1>
            <p>DRA. LAURA CAMPOS - UCR</p>
          </div>
          
          <div class="email-body">
            <h2>¡Su cita ha sido ${data.isReschedule ? 'reagendada' : 'confirmada'}!</h2>
            
            <p>Estimado/a <span class="highlight">${data.paciente}</span>,</p>
            
            <p>Le confirmamos que su cita dental ha sido ${data.isReschedule ? 'reagendada exitosamente' : 'programada exitosamente'}.</p>
            
            <div class="appointment-card">
              <h3>📅 Detalles de su cita:</h3>
              <p><strong>Fecha:</strong> ${formatDate(data.fecha)}</p>
              <p><strong>Hora:</strong> ${formatTime(data.hora_inicio)} - ${formatTime(data.hora_fin)}</p>
              <p><strong>Paciente:</strong> ${data.paciente}</p>
              <p><strong>Cédula:</strong> ${data.cedula}</p>
              ${data.notas ? `<p><strong>Notas:</strong> ${data.notas}</p>` : ''}
            </div>
            
            <p>Por favor, llegue 15 minutos antes de su cita para completar cualquier documentación necesaria.</p>
            
            <p>Si tiene alguna pregunta o necesita reprogramar su cita, no dude en contactarnos.</p>
            
            <p>¡Esperamos verle pronto!</p>
          </div>
          
          <div class="footer">
            <p>Clínica Dental - Dra. Laura Campos<br>
            Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  if (type === 'reminder') {
    const cancelUrl = `${baseUrl}/api/patient-requests/cancel?token=${data.token}`;
    const rescheduleUrl = `${baseUrl}/api/patient-requests/reschedule?token=${data.token}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recordatorio de Cita - Clínica Dental</title>
        ${commonStyles}
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <div class="logo">🦷</div>
            <h1>Clínica Dental</h1>
            <p>DRA. LAURA CAMPOS - UCR</p>
          </div>
          
          <div class="email-body">
            <h2>🔔 Recordatorio de su cita</h2>
            
            <p>Estimado/a <span class="highlight">${data.paciente}</span>,</p>
            
            <p>Le recordamos que tiene una cita dental programada para <strong>mañana</strong>.</p>
            
            <div class="appointment-card">
              <h3>📅 Detalles de su cita:</h3>
              <p><strong>Fecha:</strong> ${formatDate(data.fecha)}</p>
              <p><strong>Hora:</strong> ${formatTime(data.hora_inicio)} - ${formatTime(data.hora_fin)}</p>
              <p><strong>Paciente:</strong> ${data.paciente}</p>
              ${data.notas ? `<p><strong>Notas:</strong> ${data.notas}</p>` : ''}
            </div>
            
            <p>Por favor, llegue 15 minutos antes de su cita.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <h3>¿Necesita hacer cambios a su cita?</h3>
              <p>Utilice los siguientes botones:</p>
              
              <a href="${rescheduleUrl}" class="button btn-primary">
                📅 Reagendar Cita
              </a>
              
              <a href="${cancelUrl}" class="button btn-danger">
                ❌ Cancelar Cita
              </a>
            </div>
            
            <p><small>Nota: Si necesita cancelar o reagendar su cita, le pedimos hacerlo con al menos 24 horas de anticipación.</small></p>
          </div>
          
          <div class="footer">
            <p>Clínica Dental - Dra. Laura Campos<br>
            Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
};

const sendConfirmationEmail = async (appointmentData, isReschedule = false) => {
  try {
    if (!appointmentData.email) {
      console.log('No email address provided for appointment confirmation');
      return { success: false, error: 'No email address' };
    }

    const emailData = {
      ...appointmentData,
      isReschedule
    };

    const mailOptions = {
      from: `"Clínica Dental" <${process.env.SMTP_USER}>`,
      to: appointmentData.email,
      subject: `${isReschedule ? 'Cita Reagendada' : 'Confirmación de Cita'} - Clínica Dental`,
      html: getEmailTemplate('confirmation', emailData)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
};

const sendReminderEmail = async (appointmentData, token) => {
  try {
    if (!appointmentData.email) {
      console.log('No email address provided for appointment reminder');
      return { success: false, error: 'No email address' };
    }

    const emailData = {
      ...appointmentData,
      token
    };

    const mailOptions = {
      from: `"Clínica Dental" <${process.env.SMTP_USER}>`,
      to: appointmentData.email,
      subject: 'Recordatorio de Cita - Mañana - Clínica Dental',
      html: getEmailTemplate('reminder', emailData)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Reminder email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendConfirmationEmail,
  sendReminderEmail
};