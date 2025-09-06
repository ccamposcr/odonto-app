const Database = require('better-sqlite3');
const path = require('path');

let db;

function initDatabase() {
  if (db) return db;
  
  db = new Database(path.join(process.cwd(), 'expedientes.db'));
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS expedientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cedula TEXT UNIQUE NOT NULL,
      paciente TEXT NOT NULL,
      encargado TEXT,
      fecha_nacimiento DATE,
      edad INTEGER,
      sexo TEXT,
      telefono TEXT,
      direccion TEXT,
      contacto_emergencia TEXT,
      email TEXT,
      problemas_cardiacos BOOLEAN DEFAULT 0,
      enfermedades_rinon BOOLEAN DEFAULT 0,
      enfermedades_higado BOOLEAN DEFAULT 0,
      diabetes BOOLEAN DEFAULT 0,
      hipertension BOOLEAN DEFAULT 0,
      epilepsia BOOLEAN DEFAULT 0,
      problemas_nerviosos BOOLEAN DEFAULT 0,
      problemas_hemorragicos BOOLEAN DEFAULT 0,
      tomando_medicamentos BOOLEAN DEFAULT 0,
      alergia_medicamento BOOLEAN DEFAULT 0,
      alergia_anestesia_dental BOOLEAN DEFAULT 0,
      embarazada BOOLEAN DEFAULT 0,
      problemas_tratamiento_dental BOOLEAN DEFAULT 0,
      firma_paciente TEXT,
      odontogram_data TEXT,
      archivado BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS tratamientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expediente_id INTEGER NOT NULL,
      fecha DATE,
      pieza TEXT,
      tratamiento_ejecutado TEXT,
      firma TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expediente_id) REFERENCES expedientes (id)
    );
    
    CREATE TABLE IF NOT EXISTS superficies_dentales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expediente_id INTEGER NOT NULL,
      diente INTEGER NOT NULL,
      superficie TEXT NOT NULL,
      condicion TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expediente_id) REFERENCES expedientes (id),
      UNIQUE(expediente_id, diente, superficie)
    );
    
    CREATE TRIGGER IF NOT EXISTS update_expedientes_timestamp 
    AFTER UPDATE ON expedientes 
    BEGIN
      UPDATE expedientes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    CREATE TABLE IF NOT EXISTS medical_history_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      field_key TEXT UNIQUE NOT NULL,
      field_label TEXT NOT NULL,
      field_type TEXT DEFAULT 'boolean',
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS treatment_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      treatment_name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS citas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expediente_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fin TIME NOT NULL,
      estado TEXT DEFAULT 'programada',
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expediente_id) REFERENCES expedientes (id)
    );

    CREATE TRIGGER IF NOT EXISTS update_citas_timestamp 
    AFTER UPDATE ON citas 
    BEGIN
      UPDATE citas SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
  
  // Insertar usuario administrador por defecto si no existe
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('laura');
  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (username, password, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run('laura', '12345', 'Dra. Laura Campos', 'admin', 1);
  }

  // Insertar campos médicos por defecto si no existen
  const medicalFieldsExist = db.prepare('SELECT COUNT(*) as count FROM medical_history_fields').get();
  if (medicalFieldsExist.count === 0) {
    const defaultMedicalFields = [
      { field_key: 'problemas_cardiacos', field_label: 'Problemas cardíacos', display_order: 1 },
      { field_key: 'enfermedades_rinon', field_label: 'Enfermedades del riñón', display_order: 2 },
      { field_key: 'enfermedades_higado', field_label: 'Enfermedades del hígado', display_order: 3 },
      { field_key: 'diabetes', field_label: 'Diabetes', display_order: 4 },
      { field_key: 'hipertension', field_label: 'Hipertensión', display_order: 5 },
      { field_key: 'epilepsia', field_label: 'Epilepsia', display_order: 6 },
      { field_key: 'problemas_nerviosos', field_label: 'Problemas nerviosos', display_order: 7 },
      { field_key: 'problemas_hemorragicos', field_label: 'Problemas hemorrágicos', display_order: 8 },
      { field_key: 'tomando_medicamentos', field_label: 'Tomando medicamentos', display_order: 9 },
      { field_key: 'alergia_medicamento', field_label: 'Alergia a medicamentos', display_order: 10 },
      { field_key: 'alergia_anestesia_dental', field_label: 'Alergia a anestesia dental', display_order: 11 },
      { field_key: 'embarazada', field_label: 'Embarazada', display_order: 12 },
      { field_key: 'problemas_tratamiento_dental', field_label: 'Problemas con tratamientos dentales anteriores', display_order: 13 }
    ];

    const insertMedicalField = db.prepare(`
      INSERT INTO medical_history_fields (field_key, field_label, field_type, is_active, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    defaultMedicalFields.forEach(field => {
      insertMedicalField.run(field.field_key, field.field_label, 'boolean', 1, field.display_order);
    });
  }

  // Insertar opciones de tratamiento por defecto si no existen
  const treatmentOptionsExist = db.prepare('SELECT COUNT(*) as count FROM treatment_options').get();
  if (treatmentOptionsExist.count === 0) {
    const defaultTreatments = [
      { category: "Tipos de resina", treatment_name: "Resina CI", display_order: 1 },
      { category: "Tipos de resina", treatment_name: "Resina CII", display_order: 2 },
      { category: "Tipos de resina", treatment_name: "Resina CIII", display_order: 3 },
      { category: "Tipos de resina", treatment_name: "Resina CIV", display_order: 4 },
      { category: "Tipos de resina", treatment_name: "Resina CV", display_order: 5 },
      { category: "Limpieza", treatment_name: "Limpieza", display_order: 6 },
      { category: "Limpieza", treatment_name: "Limpieza con anestesia", display_order: 7 },
      { category: "Cirugía", treatment_name: "Extracción", display_order: 8 },
      { category: "Cirugía", treatment_name: "Extracción quirúrgica", display_order: 9 },
      { category: "Cirugía", treatment_name: "Cirugía", display_order: 10 },
      { category: "Prótesis", treatment_name: "Prótesis parcial", display_order: 11 },
      { category: "Prótesis", treatment_name: "Prótesis total", display_order: 12 },
      { category: "Prótesis", treatment_name: "Corona", display_order: 13 },
      { category: "Prótesis", treatment_name: "Puente", display_order: 14 },
      { category: "Especialidades", treatment_name: "Ortodoncia", display_order: 15 },
      { category: "Especialidades", treatment_name: "Tratamiento periodontal", display_order: 16 },
      { category: "Especialidades", treatment_name: "Endodoncia", display_order: 17 },
      { category: "Especialidades", treatment_name: "Endoposte", display_order: 18 },
      { category: "Estética", treatment_name: "Blanqueamiento láser", display_order: 19 },
      { category: "Estética", treatment_name: "Blanqueamiento de fundas", display_order: 20 },
      { category: "Implantología", treatment_name: "Implante dental", display_order: 21 }
    ];

    const insertTreatment = db.prepare(`
      INSERT INTO treatment_options (category, treatment_name, is_active, display_order)
      VALUES (?, ?, ?, ?)
    `);

    defaultTreatments.forEach(treatment => {
      insertTreatment.run(treatment.category, treatment.treatment_name, 1, treatment.display_order);
    });
  }

  // Sync medical history fields with expedientes table columns
  const medicalFields = db.prepare('SELECT field_key FROM medical_history_fields WHERE is_active = 1').all();
  const tableInfo = db.prepare('PRAGMA table_info(expedientes)').all();
  const existingColumns = new Set(tableInfo.map(col => col.name));

  for (const field of medicalFields) {
    if (!existingColumns.has(field.field_key)) {
      try {
        db.exec(`ALTER TABLE expedientes ADD COLUMN ${field.field_key} BOOLEAN DEFAULT 0;`);
        console.log(`Added column ${field.field_key} to expedientes table`);
      } catch (error) {
        console.warn(`Failed to add column ${field.field_key}:`, error.message);
      }
    }
  }
  
  return db;
}

module.exports = { initDatabase };