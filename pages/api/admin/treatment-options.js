import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'expedientes.db');

export default function handler(req, res) {
  const db = new Database(dbPath);

  try {
    if (req.method === 'GET') {
      // Get all treatment options grouped by category
      const treatments = db.prepare(`
        SELECT * FROM treatment_options 
        WHERE is_active = 1
        ORDER BY display_order ASC, category ASC, treatment_name ASC
      `).all();

      // Group by category for the dropdown
      const grouped = treatments.reduce((acc, treatment) => {
        if (!acc[treatment.category]) {
          acc[treatment.category] = [];
        }
        acc[treatment.category].push(treatment);
        return acc;
      }, {});

      res.status(200).json({ treatments, grouped });

    } else if (req.method === 'POST') {
      // Create new treatment option
      let { category, treatment_name, is_active = true, display_order = 0 } = req.body;
      
      // Trim text fields
      category = category?.toString().trim();
      treatment_name = treatment_name?.toString().trim();
      
      // Convert boolean to integer for SQLite
      is_active = is_active ? 1 : 0;

      if (!category || !treatment_name) {
        return res.status(400).json({ error: 'category and treatment_name are required' });
      }

      try {
        // Begin transaction to ensure atomicity
        const insertTransaction = db.transaction(() => {
          // If display_order is 1 (new treatment at top), increment all existing treatments
          if (display_order === 1) {
            db.prepare(`
              UPDATE treatment_options 
              SET display_order = display_order + 1 
              WHERE display_order >= 1
            `).run();
          }

          const result = db.prepare(`
            INSERT INTO treatment_options (category, treatment_name, is_active, display_order)
            VALUES (?, ?, ?, ?)
          `).run(category, treatment_name, is_active, display_order);

          return result;
        });

        const result = insertTransaction();
        
        const newTreatment = db.prepare('SELECT * FROM treatment_options WHERE id = ?').get(result.lastInsertRowid);
        
        res.status(201).json(newTreatment);
      } catch (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Error creating treatment: ' + insertError.message });
      }

    } else if (req.method === 'PUT') {
      // Update treatment option
      let { id, category, treatment_name, is_active, display_order } = req.body;
      
      // Trim text fields
      category = category?.toString().trim() || category;
      treatment_name = treatment_name?.toString().trim() || treatment_name;
      
      // Convert boolean to integer for SQLite if provided
      if (typeof is_active === 'boolean') {
        is_active = is_active ? 1 : 0;
      }

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const result = db.prepare(`
        UPDATE treatment_options 
        SET category = COALESCE(?, category),
            treatment_name = COALESCE(?, treatment_name),
            is_active = COALESCE(?, is_active),
            display_order = COALESCE(?, display_order)
        WHERE id = ?
      `).run(category, treatment_name, is_active, display_order, id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Treatment not found' });
      }

      const updatedTreatment = db.prepare('SELECT * FROM treatment_options WHERE id = ?').get(id);
      res.status(200).json(updatedTreatment);

    } else if (req.method === 'DELETE') {
      // Delete treatment option
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const result = db.prepare('DELETE FROM treatment_options WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Treatment not found' });
      }

      res.status(200).json({ message: 'Treatment deleted successfully' });

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