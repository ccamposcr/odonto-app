import { initDatabase } from '../../../lib/database';

export default function handler(req, res) {
  const db = initDatabase();

  try {
    if (req.method === 'GET') {
      // Obtener todos los usuarios (sin passwords)
      const users = db.prepare(`
        SELECT id, username, full_name, role, is_active, created_at, last_login
        FROM users 
        ORDER BY created_at DESC
      `).all();
      
      return res.status(200).json({ users });

    } else if (req.method === 'POST') {
      // Crear nuevo usuario
      let { username, password, full_name, role = 'user', is_active = true } = req.body;
      
      // Trim text fields
      username = username?.toString().trim();
      full_name = full_name?.toString().trim();
      role = role?.toString().trim();
      
      // Convert boolean to integer for SQLite
      is_active = is_active ? 1 : 0;

      if (!username || !password || !full_name) {
        return res.status(400).json({ error: 'username, password, and full_name are required' });
      }

      // Verificar si el usuario ya existe
      const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Crear usuario
      const result = db.prepare(`
        INSERT INTO users (username, password, full_name, role, is_active)
        VALUES (?, ?, ?, ?, ?)
      `).run(username, password, full_name, role, is_active);
      
      const newUser = db.prepare(`
        SELECT id, username, full_name, role, is_active, created_at
        FROM users WHERE id = ?
      `).get(result.lastInsertRowid);
      
      res.status(201).json(newUser);

    } else if (req.method === 'PUT') {
      // Actualizar usuario
      let { id, username, password, full_name, role, is_active } = req.body;
      
      // Trim text fields
      if (username) username = username.toString().trim();
      if (full_name) full_name = full_name.toString().trim();
      if (role) role = role.toString().trim();
      
      // Convert boolean to integer for SQLite if provided
      if (typeof is_active === 'boolean') {
        is_active = is_active ? 1 : 0;
      }

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      // Construir query dinámicamente
      const fieldsToUpdate = [];
      const values = [];
      
      if (username) {
        fieldsToUpdate.push('username = ?');
        values.push(username);
      }
      if (password) {
        fieldsToUpdate.push('password = ?');
        values.push(password);
      }
      if (full_name) {
        fieldsToUpdate.push('full_name = ?');
        values.push(full_name);
      }
      if (role) {
        fieldsToUpdate.push('role = ?');
        values.push(role);
      }
      if (typeof is_active === 'number') {
        fieldsToUpdate.push('is_active = ?');
        values.push(is_active);
      }
      
      if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const result = db.prepare(`
        UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?
      `).run(...values);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = db.prepare(`
        SELECT id, username, full_name, role, is_active, created_at, updated_at
        FROM users WHERE id = ?
      `).get(id);
      
      res.status(200).json(updatedUser);

    } else if (req.method === 'DELETE') {
      // Eliminar usuario
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      // No permitir eliminar el usuario admin principal
      const user = db.prepare('SELECT username FROM users WHERE id = ?').get(id);
      if (user && user.username === 'laura') {
        return res.status(403).json({ error: 'Cannot delete main admin user' });
      }

      const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ message: 'User deleted successfully' });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}