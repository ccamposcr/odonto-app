// This file exists to support the /expediente/[id]/editar route
// The actual API logic is handled by /api/expedientes/[id].js
export default function handler(req, res) {
  return res.status(404).json({ error: 'Not found' });
}