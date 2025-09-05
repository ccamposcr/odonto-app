import { initDatabase } from '../../../lib/database';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const db = initDatabase();
    
    // Buscar usuario
    const user = db.prepare(`
      SELECT id, username, full_name, role, is_active 
      FROM users 
      WHERE username = ? AND password = ? AND is_active = 1
    `).get(username.trim(), password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Actualizar último login
    db.prepare(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(user.id);

    // Devolver información del usuario (sin password)
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}