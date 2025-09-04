import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'expedientes.db');

export default function handler(req, res) {
  const db = new Database(dbPath);

  try {
    if (req.method === 'GET') {
      // Get all medical history fields
      const fields = db.prepare(`
        SELECT * FROM medical_history_fields 
        ORDER BY display_order ASC, field_label ASC
      `).all();

      res.status(200).json(fields);

    } else if (req.method === 'POST') {
      // Create new medical history field
      let { field_key, field_label, field_type = 'boolean', is_active = true, display_order = 0 } = req.body;
      
      // Convert boolean to integer for SQLite
      is_active = is_active ? 1 : 0;

      if (!field_label) {
        return res.status(400).json({ error: 'field_label is required' });
      }

      // Generate field_key if not provided
      if (!field_key) {
        let baseKey = field_label
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        
        field_key = baseKey;
        let counter = 1;
        
        // Ensure field_key is unique
        while (db.prepare('SELECT id FROM medical_history_fields WHERE field_key = ?').get(field_key)) {
          field_key = `${baseKey}_${counter}`;
          counter++;
        }
      } else {
        // Check if provided field_key already exists
        const existing = db.prepare('SELECT id FROM medical_history_fields WHERE field_key = ?').get(field_key);
        if (existing) {
          return res.status(409).json({ error: 'Field key already exists' });
        }
      }

      try {
        // Begin transaction to ensure atomicity
        const insertTransaction = db.transaction(() => {
          // If display_order is 1 (new field at top), increment all existing fields
          if (display_order === 1) {
            db.prepare(`
              UPDATE medical_history_fields 
              SET display_order = display_order + 1 
              WHERE display_order >= 1
            `).run();
          }

          const result = db.prepare(`
            INSERT INTO medical_history_fields (field_key, field_label, field_type, is_active, display_order)
            VALUES (?, ?, ?, ?, ?)
          `).run(field_key, field_label, field_type, is_active, display_order);

          return result;
        });

        const result = insertTransaction();
        
        const newField = db.prepare('SELECT * FROM medical_history_fields WHERE id = ?').get(result.lastInsertRowid);
        
        res.status(201).json(newField);
      } catch (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Error creating field: ' + insertError.message });
      }

    } else if (req.method === 'PUT') {
      // Update medical history field
      let { id, field_label, field_type, is_active, display_order } = req.body;
      
      // Convert boolean to integer for SQLite if provided
      if (typeof is_active === 'boolean') {
        is_active = is_active ? 1 : 0;
      }

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const result = db.prepare(`
        UPDATE medical_history_fields 
        SET field_label = COALESCE(?, field_label),
            field_type = COALESCE(?, field_type),
            is_active = COALESCE(?, is_active),
            display_order = COALESCE(?, display_order)
        WHERE id = ?
      `).run(field_label, field_type, is_active, display_order, id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Field not found' });
      }

      const updatedField = db.prepare('SELECT * FROM medical_history_fields WHERE id = ?').get(id);
      res.status(200).json(updatedField);

    } else if (req.method === 'DELETE') {
      // Delete medical history field
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const result = db.prepare('DELETE FROM medical_history_fields WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Field not found' });
      }

      res.status(200).json({ message: 'Field deleted successfully' });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
}