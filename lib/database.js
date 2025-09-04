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
  `);
  
  return db;
}

module.exports = { initDatabase };