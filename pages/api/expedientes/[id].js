import { initDatabase } from '../../../lib/database';
import { emitExpedientesUpdate } from '../../../lib/socketEmitter';

export default async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;

  try {
    if (method === 'GET') {
      const db = initDatabase();
      
      const expediente = db.prepare(`
        SELECT * FROM expedientes WHERE id = ?
      `).get(id);
      
      if (!expediente) {
        return res.status(404).json({ error: 'Expediente not found' });
      }
      
      const tratamientos = db.prepare(`
        SELECT * FROM tratamientos WHERE expediente_id = ? ORDER BY created_at DESC
      `).all(id);
      
      expediente.tratamientos = tratamientos;
      
      return res.status(200).json(expediente);
    }

    if (method === 'PUT') {
      const data = req.body;
      const db = initDatabase();
      
      const { tratamientos, ...expedienteData } = data;
      
      // Get all active medical fields from the database
      const medicalFields = db.prepare(`
        SELECT field_key FROM medical_history_fields 
        WHERE is_active = 1
        ORDER BY display_order ASC
      `).all();
      
      // Build dynamic SQL query
      const baseFields = ['paciente', 'encargado', 'fecha_nacimiento', 'edad', 'sexo', 
                         'telefono', 'direccion', 'contacto_emergencia', 'email'];
      
      const medicalFieldNames = medicalFields.map(field => field.field_key);
      const allFields = [...baseFields, ...medicalFieldNames, 'firma_paciente', 'odontogram_data', 'updated_at'];
      
      const setClause = allFields.map(field => 
        field === 'updated_at' ? `${field} = CURRENT_TIMESTAMP` : `${field} = ?`
      ).join(', ');
      
      const stmt = db.prepare(`
        UPDATE expedientes SET ${setClause}
        WHERE id = ?
      `);
      
      // Prepare values array (excluding updated_at since it's handled separately)
      const values = [
        expedienteData.paciente?.toString().trim(),
        expedienteData.encargado?.toString().trim() || null,
        expedienteData.fecha_nacimiento || null,
        expedienteData.edad || null,
        expedienteData.sexo || null,
        expedienteData.telefono?.toString().trim() || null,
        expedienteData.direccion?.toString().trim() || null,
        expedienteData.contacto_emergencia?.toString().trim() || null,
        expedienteData.email?.toString().trim() || null,
        // Add medical field values dynamically
        ...medicalFieldNames.map(fieldKey => expedienteData[fieldKey] ? 1 : 0),
        expedienteData.firma_paciente || null,
        expedienteData.odontogram_data || '{}',
        id
      ];
      
      const result = stmt.run(...values);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Expediente not found' });
      }

      // Delete existing treatments and surface data
      db.prepare('DELETE FROM tratamientos WHERE expediente_id = ?').run(id);
      db.prepare('DELETE FROM superficies_dentales WHERE expediente_id = ?').run(id);

      // Save treatments
      if (tratamientos && tratamientos.length > 0) {
        const treatmentStmt = db.prepare(`
          INSERT INTO tratamientos (expediente_id, fecha, pieza, tratamiento_ejecutado, firma)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        for (const treatment of tratamientos) {
          if (treatment.fecha || treatment.pieza || treatment.tratamiento_ejecutado) {
            treatmentStmt.run(
              id,
              treatment.fecha || null,
              treatment.pieza || null,
              treatment.tratamiento_ejecutado || null,
              treatment.firma || null
            );
          }
        }
      }

      // Save updated dental surface data for reporting
      if (expedienteData.odontogram_data) {
        try {
          const odontogramData = typeof expedienteData.odontogram_data === 'string' 
            ? JSON.parse(expedienteData.odontogram_data) 
            : expedienteData.odontogram_data;
          
          if (odontogramData.toothStates) {
            const surfaceStmt = db.prepare(`
              INSERT INTO superficies_dentales (expediente_id, diente, superficie, condicion, updated_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);
            
            for (const [diente, superficies] of Object.entries(odontogramData.toothStates)) {
              if (typeof superficies === 'object' && superficies !== null) {
                for (const [superficie, condicion] of Object.entries(superficies)) {
                  if (condicion && condicion !== 'normal') {
                    surfaceStmt.run(id, parseInt(diente), superficie, condicion);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error saving updated dental surface data:', error);
        }
      }

      // Emitir evento de actualización via Socket.IO
      emitExpedientesUpdate(res);

      return res.status(200).json({ message: 'Expediente updated successfully' });
    }

    if (method === 'PATCH') {
      const data = req.body;
      const db = initDatabase();
      
      const stmt = db.prepare(`
        UPDATE expedientes SET archivado = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      const result = stmt.run(data.archivado ? 1 : 0, id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Expediente not found' });
      }

      // Emitir evento de actualización via Socket.IO
      emitExpedientesUpdate(res);

      return res.status(200).json({ message: 'Expediente archived successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in expediente API:', error);
    return res.status(500).json({ error: 'Error processing request' });
  }
}