import { NextResponse } from 'next/server';
import { initDatabase } from '../../../lib/database';

export async function GET() {
  try {
    const db = initDatabase();
    const expedientes = db.prepare(`
      SELECT * FROM expedientes 
      ORDER BY created_at DESC
    `).all();
    
    return NextResponse.json(expedientes);
  } catch (error) {
    console.error('Error fetching expedientes:', error);
    return NextResponse.json({ error: 'Error fetching expedientes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const db = initDatabase();
    
    const { tratamientos, ...expedienteData } = data;
    
    const stmt = db.prepare(`
      INSERT INTO expedientes (
        cedula, paciente, encargado, fecha_nacimiento, edad, sexo, 
        telefono, direccion, contacto_emergencia, email,
        problemas_cardiacos, enfermedades_rinon, enfermedades_higado, 
        diabetes, hipertension, epilepsia, problemas_nerviosos,
        problemas_hemorragicos, tomando_medicamentos, alergia_medicamento,
        alergia_anestesia_dental, embarazada, problemas_tratamiento_dental,
        firma_paciente, odontogram_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      expedienteData.cedula,
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
      expedienteData.odontogram_data || '{}'
    );

    const expedienteId = result.lastInsertRowid;

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

    return NextResponse.json({ 
      id: expedienteId, 
      message: 'Expediente created successfully' 
    });
  } catch (error) {
    console.error('Error creating expediente:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Ya existe un expediente con esta cédula' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error creating expediente' }, { status: 500 });
  }
}