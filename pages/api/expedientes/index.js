import { initDatabase } from '../../../lib/database';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const db = initDatabase();
      const expedientes = db.prepare(`
        SELECT * FROM expedientes 
        ORDER BY created_at DESC
      `).all();
      
      return res.status(200).json(expedientes);
    }

    if (method === 'POST') {
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
      const baseFields = ['cedula', 'paciente', 'encargado', 'fecha_nacimiento', 'edad', 'sexo', 
                         'telefono', 'direccion', 'contacto_emergencia', 'email'];
      
      const medicalFieldNames = medicalFields.map(field => field.field_key);
      const allFields = [...baseFields, ...medicalFieldNames, 'firma_paciente', 'odontogram_data'];
      
      const placeholders = allFields.map(() => '?').join(', ');
      const fieldsList = allFields.join(', ');
      
      const stmt = db.prepare(`
        INSERT INTO expedientes (${fieldsList})
        VALUES (${placeholders})
      `);
      
      // Prepare values array
      const values = [
        expedienteData.cedula?.toString().trim(),
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
        expedienteData.odontogram_data || '{}'
      ];
      
      const result = stmt.run(...values);

      const expedienteId = result.lastInsertRowid;

      // Save treatments
      if (tratamientos && tratamientos.length > 0) {
        const treatmentStmt = db.prepare(`
          INSERT INTO tratamientos (expediente_id, fecha, pieza, tratamiento_ejecutado, firma)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        for (const treatment of tratamientos) {
          if (treatment.fecha || treatment.pieza || treatment.tratamiento_ejecutado) {
            treatmentStmt.run(
              expedienteId,
              treatment.fecha || null,
              treatment.pieza || null,
              treatment.tratamiento_ejecutado || null,
              treatment.firma || null
            );
          }
        }
      }

      // Save dental surface data for reporting
      if (expedienteData.odontogram_data) {
        try {
          const odontogramData = typeof expedienteData.odontogram_data === 'string' 
            ? JSON.parse(expedienteData.odontogram_data) 
            : expedienteData.odontogram_data;
          
          if (odontogramData.toothStates) {
            const surfaceStmt = db.prepare(`
              INSERT OR REPLACE INTO superficies_dentales (expediente_id, diente, superficie, condicion, updated_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);
            
            for (const [diente, superficies] of Object.entries(odontogramData.toothStates)) {
              if (typeof superficies === 'object' && superficies !== null) {
                for (const [superficie, condicion] of Object.entries(superficies)) {
                  if (condicion && condicion !== 'normal') {
                    surfaceStmt.run(expedienteId, parseInt(diente), superficie, condicion);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error saving dental surface data:', error);
        }
      }

      return res.status(200).json({ 
        id: expedienteId, 
        message: 'Expediente created successfully' 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in expedientes API:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Ya existe un expediente con esta cédula' });
    }
    return res.status(500).json({ error: 'Error processing request' });
  }
}