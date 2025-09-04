import { NextResponse } from 'next/server';
import { initDatabase } from '../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const db = initDatabase();
    const { id } = params;
    
    const expediente = db.prepare(`
      SELECT * FROM expedientes WHERE id = ?
    `).get(id);
    
    if (!expediente) {
      return NextResponse.json({ error: 'Expediente not found' }, { status: 404 });
    }
    
    const tratamientos = db.prepare(`
      SELECT * FROM tratamientos WHERE expediente_id = ? ORDER BY created_at DESC
    `).all(id);
    
    expediente.tratamientos = tratamientos;
    
    return NextResponse.json(expediente);
  } catch (error) {
    console.error('Error fetching expediente:', error);
    return NextResponse.json({ error: 'Error fetching expediente' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const db = initDatabase();
    const { id } = params;
    
    const { tratamientos, ...expedienteData } = data;
    
    const stmt = db.prepare(`
      UPDATE expedientes SET
        paciente = ?, encargado = ?, fecha_nacimiento = ?, edad = ?, sexo = ?, 
        telefono = ?, direccion = ?, contacto_emergencia = ?, email = ?,
        problemas_cardiacos = ?, enfermedades_rinon = ?, enfermedades_higado = ?, 
        diabetes = ?, hipertension = ?, epilepsia = ?, problemas_nerviosos = ?,
        problemas_hemorragicos = ?, tomando_medicamentos = ?, alergia_medicamento = ?,
        alergia_anestesia_dental = ?, embarazada = ?, problemas_tratamiento_dental = ?,
        firma_paciente = ?, odontogram_data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      expedienteData.paciente,
      expedienteData.encargado || null,
      expedienteData.fecha_nacimiento || null,
      expedienteData.edad || null,
      expedienteData.sexo || null,
      expedienteData.telefono || null,
      expedienteData.direccion || null,
      expedienteData.contacto_emergencia || null,
      expedienteData.email || null,
      expedienteData.problemas_cardiacos ? 1 : 0,
      expedienteData.enfermedades_rinon ? 1 : 0,
      expedienteData.enfermedades_higado ? 1 : 0,
      expedienteData.diabetes ? 1 : 0,
      expedienteData.hipertension ? 1 : 0,
      expedienteData.epilepsia ? 1 : 0,
      expedienteData.problemas_nerviosos ? 1 : 0,
      expedienteData.problemas_hemorragicos ? 1 : 0,
      expedienteData.tomando_medicamentos ? 1 : 0,
      expedienteData.alergia_medicamento ? 1 : 0,
      expedienteData.alergia_anestesia_dental ? 1 : 0,
      expedienteData.embarazada ? 1 : 0,
      expedienteData.problemas_tratamiento_dental ? 1 : 0,
      expedienteData.firma_paciente || null,
      expedienteData.odontogram_data || '{}',
      id
    );
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Expediente not found' }, { status: 404 });
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

    return NextResponse.json({ message: 'Expediente updated successfully' });
  } catch (error) {
    console.error('Error updating expediente:', error);
    return NextResponse.json({ error: 'Error updating expediente' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const data = await request.json();
    const db = initDatabase();
    const { id } = params;
    
    const stmt = db.prepare(`
      UPDATE expedientes SET archivado = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(data.archivado ? 1 : 0, id);
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Expediente not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Expediente archived successfully' });
  } catch (error) {
    console.error('Error archiving expediente:', error);
    return NextResponse.json({ error: 'Error archiving expediente' }, { status: 500 });
  }
}