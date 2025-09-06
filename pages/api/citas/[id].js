import { initDatabase } from '../../../lib/database';
import { sendConfirmationEmail } from '../../../lib/emailService';
import { emitCitasUpdate } from '../../../lib/socketEmitter';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  try {
    const db = initDatabase();

    if (method === 'GET') {
      const cita = db.prepare(`
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
          e.paciente,
          e.telefono,
          e.email
        FROM citas c
        INNER JOIN expedientes e ON c.expediente_id = e.id
        WHERE c.id = ?
      `).get(id);

      if (!cita) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      return res.status(200).json(cita);
    }

    if (method === 'PUT') {
      const { expediente_id, fecha, hora_inicio, hora_fin, estado, notas } = req.body;

      // Verificar que la cita existe
      const citaExiste = db.prepare('SELECT id FROM citas WHERE id = ?').get(id);
      if (!citaExiste) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Si se está cambiando la fecha/hora, validar conflictos
      if (fecha && hora_inicio && hora_fin) {
        const conflicto = db.prepare(`
          SELECT id FROM citas 
          WHERE fecha = ? 
          AND id != ?
          AND estado != 'cancelada'
          AND (
            (hora_inicio <= ? AND hora_fin > ?) OR
            (hora_inicio < ? AND hora_fin >= ?) OR
            (hora_inicio >= ? AND hora_fin <= ?)
          )
        `).get(fecha, id, hora_inicio, hora_inicio, hora_fin, hora_fin, hora_inicio, hora_fin);

        if (conflicto) {
          return res.status(400).json({ 
            error: 'Ya existe una cita programada en este horario' 
          });
        }
      }

      // Actualizar cita
      let query = 'UPDATE citas SET updated_at = CURRENT_TIMESTAMP';
      let params = [];

      if (expediente_id !== undefined) {
        // Verificar que el expediente existe
        const expediente = db.prepare('SELECT id FROM expedientes WHERE id = ?').get(expediente_id);
        if (!expediente) {
          return res.status(400).json({ 
            error: 'El expediente especificado no existe' 
          });
        }
        query += ', expediente_id = ?';
        params.push(expediente_id);
      }

      if (fecha !== undefined) {
        query += ', fecha = ?';
        params.push(fecha);
      }

      if (hora_inicio !== undefined) {
        query += ', hora_inicio = ?';
        params.push(hora_inicio);
      }

      if (hora_fin !== undefined) {
        query += ', hora_fin = ?';
        params.push(hora_fin);
      }

      if (estado !== undefined) {
        query += ', estado = ?';
        params.push(estado);
      }

      if (notas !== undefined) {
        query += ', notas = ?';
        params.push(notas);
      }

      query += ' WHERE id = ?';
      params.push(id);

      // Obtener datos originales para comparar si cambió fecha/hora
      const citaOriginal = db.prepare(`
        SELECT fecha, hora_inicio, hora_fin FROM citas WHERE id = ?
      `).get(id);

      const stmt = db.prepare(query);
      const result = stmt.run(...params);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'No se pudo actualizar la cita' });
      }

      // Verificar si cambió fecha u hora para enviar email de reagendado
      const fechaCambio = fecha && fecha !== citaOriginal.fecha;
      const horaCambio = (hora_inicio && hora_inicio !== citaOriginal.hora_inicio) || 
                        (hora_fin && hora_fin !== citaOriginal.hora_fin);

      if (fechaCambio || horaCambio) {
        // Obtener información actualizada del paciente para el email
        const citaCompleta = db.prepare(`
          SELECT c.*, e.paciente, e.cedula, e.email
          FROM citas c
          JOIN expedientes e ON c.expediente_id = e.id
          WHERE c.id = ?
        `).get(id);

        // Enviar email de reagendado si el paciente tiene email
        if (citaCompleta.email) {
          try {
            await sendConfirmationEmail(citaCompleta, true);
          } catch (error) {
            console.error('Error sending reschedule confirmation email:', error);
            // No fallar la actualización si el email falla
          }
        }
      }

      // Emitir evento de actualización via Socket.IO
      emitCitasUpdate(res);

      return res.status(200).json({ 
        message: 'Cita actualizada exitosamente' 
      });
    }

    if (method === 'DELETE') {
      // Marcar como cancelada en lugar de eliminar
      const stmt = db.prepare(`
        UPDATE citas 
        SET estado = 'cancelada', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      const result = stmt.run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Emitir evento de actualización via Socket.IO
      emitCitasUpdate(res);

      return res.status(200).json({ 
        message: 'Cita cancelada exitosamente' 
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error in citas [id] API:', error);
    return res.status(500).json({ error: 'Error procesando la solicitud' });
  }
}