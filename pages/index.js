import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [expedientes, setExpedientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExpedientes();
  }, []);

  const fetchExpedientes = async () => {
    try {
      const response = await fetch('/api/expedientes');
      const data = await response.json();
      setExpedientes(data);
    } catch (error) {
      console.error('Error fetching expedientes:', error);
    }
  };

  const filteredExpedientes = expedientes.filter(exp => 
    exp.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.cedula.includes(searchTerm)
  );

  const archivarExpediente = async (id) => {
    try {
      await fetch(`/api/expedientes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivado: true })
      });
      fetchExpedientes();
    } catch (error) {
      console.error('Error archiving expediente:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-dental-teal text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-dental-teal text-xl font-bold">🦷</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Clínica Dental</h1>
                <p className="text-dental-teal-100">DRA. LAURA CAMPOS - UCR</p>
              </div>
            </div>
            <Link href="/expediente/nuevo" className="btn btn-primary bg-white text-dental-teal hover:bg-gray-100">
              Nuevo Expediente
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Expedientes Clínicos</h2>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Buscar por paciente o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-dental-teal"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-dental-teal text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Cédula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpedientes.map((expediente) => (
                <tr key={expediente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {expediente.cedula}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expediente.paciente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expediente.telefono || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expediente.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      expediente.archivado 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {expediente.archivado ? 'Archivado' : 'Activo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link 
                      href={`/expediente/${expediente.id}`}
                      className="text-dental-teal hover:text-dental-dark-teal"
                    >
                      Ver
                    </Link>
                    <Link 
                      href={`/expediente/${expediente.id}/editar`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </Link>
                    {!expediente.archivado && (
                      <button 
                        onClick={() => archivarExpediente(expediente.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Archivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredExpedientes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No se encontraron expedientes</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}