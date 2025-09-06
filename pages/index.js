import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Modal from '../components/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import useModal from '../hooks/useModal';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const [expedientes, setExpedientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { modal, closeModal, showConfirm, showSuccess, showError } = useModal();
  const { user, logout, isAdmin } = useAuth();

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
    exp.paciente.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
    exp.cedula.includes(searchTerm.trim())
  );

  const archivarExpediente = async (id) => {
    showConfirm(
      'Confirmar archivado',
      '¿Está seguro que desea archivar este expediente?\n\nUna vez archivado no podrá realizar más modificaciones.',
      async () => {
        try {
          const response = await fetch(`/api/expedientes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivado: true })
          });
          
          if (response.ok) {
            showSuccess('¡Expediente archivado!', 'El expediente se ha archivado exitosamente');
            fetchExpedientes();
          } else {
            showError('Error al archivar', 'No se pudo archivar el expediente');
          }
        } catch (error) {
          console.error('Error archiving expediente:', error);
          showError('Error de conexión', 'Error al archivar el expediente. Verifique su conexión.');
        }
      },
      'Archivar',
      'Cancelar'
    );
  };

  const desarchivarExpediente = async (id) => {
    showConfirm(
      'Confirmar desarchivado',
      '¿Está seguro que desea desarchivar este expediente?\n\nPodrá volver a editarlo una vez desarchivado.',
      async () => {
        try {
          const response = await fetch(`/api/expedientes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivado: false })
          });
          
          if (response.ok) {
            showSuccess('¡Expediente desarchivado!', 'El expediente se ha desarchivado exitosamente');
            fetchExpedientes();
          } else {
            showError('Error al desarchivar', 'No se pudo desarchivar el expediente');
          }
        } catch (error) {
          console.error('Error unarchiving expediente:', error);
          showError('Error de conexión', 'Error al desarchivar el expediente. Verifique su conexión.');
        }
      },
      'Desarchivar',
      'Cancelar'
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      <header className="bg-dental-teal text-white">
        {/* Header principal */}
        <div className="p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  <Image
                    src="/images/dental-logo.png"
                    alt="Clínica Dental Logo"
                    width={48}
                    height={48}
                    priority
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Clínica Dental</h1>
                  <p className="text-xs md:text-sm text-dental-teal-100">DRA. LAURA CAMPOS - UCR</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {/* Usuario info */}
                <div className="text-right text-sm hidden sm:block">
                  <p className="text-dental-teal-100">Bienvenido, {user?.fullName}</p>
                  <p className="text-dental-teal-200 text-xs capitalize">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
                </div>
                
                {/* Botón de logout */}
                <button
                  onClick={logout}
                  className="btn btn-outline border-dental-teal-200 text-dental-teal-100 hover:bg-dental-teal-200 hover:text-dental-dark-teal text-xs"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de botones de acción */}
        <div className="bg-dental-teal-600 border-t border-dental-teal-400">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              {/* Usuario info para móvil */}
              <div className="sm:hidden text-center text-sm">
                <p className="text-dental-teal-100">Bienvenido, {user?.fullName}</p>
                <p className="text-dental-teal-200 text-xs capitalize">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                {/* Gestión de Citas */}
                <Link href="/citas" className="btn !bg-blue-600 text-white hover:!bg-blue-700 w-full sm:w-auto text-center font-semibold shadow-md transition-all flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Gestión de Citas
                </Link>

                {/* Botones de admin */}
                {isAdmin() && (
                  <>
                    <Link href="/expediente/nuevo" className="btn !bg-emerald-600 text-white hover:!bg-emerald-700 w-full sm:w-auto text-center font-semibold shadow-md transition-all flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Nuevo Expediente
                    </Link>
                    
                    <Link href="/admin/configuracion" className="btn !bg-gray-600 text-white hover:!bg-gray-700 w-full sm:w-auto text-center font-medium shadow-md transition-all flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configuración
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 md:p-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-4 md:space-y-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Expedientes Clínicos</h2>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-auto px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-dental-teal"
              />
            </div>
          </div>
        </div>

        {/* Vista de tabla para desktop y tablet */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dental-teal text-white">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Cédula
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpedientes.map((expediente) => (
                  <tr key={expediente.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expediente.cedula}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expediente.paciente}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expediente.telefono || '-'}
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expediente.email || '-'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        expediente.archivado 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {expediente.archivado ? 'Archivado' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col xl:flex-row xl:space-x-2 space-y-1 xl:space-y-0">
                        <Link 
                          href={`/expediente/${expediente.id}`}
                          className="text-dental-teal hover:text-dental-dark-teal"
                        >
                          Ver
                        </Link>
                        {!expediente.archivado && (
                          <Link 
                            href={`/expediente/${expediente.id}/editar`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </Link>
                        )}
                        {!expediente.archivado ? (
                          <button 
                            onClick={() => archivarExpediente(expediente.id)}
                            className="text-red-600 hover:text-red-900 text-left"
                          >
                            Archivar
                          </button>
                        ) : (
                          <button 
                            onClick={() => desarchivarExpediente(expediente.id)}
                            className="text-green-600 hover:text-green-900 text-left"
                          >
                            Desarchivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vista de cards para móvil */}
        <div className="md:hidden space-y-4">
          {filteredExpedientes.map((expediente) => (
            <div key={expediente.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{expediente.paciente}</h3>
                  <p className="text-sm text-gray-600">Cédula: {expediente.cedula}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  expediente.archivado 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {expediente.archivado ? 'Archivado' : 'Activo'}
                </span>
              </div>
              
              {(expediente.telefono || expediente.email) && (
                <div className="mb-3 text-sm text-gray-600">
                  {expediente.telefono && <p>Tel: {expediente.telefono}</p>}
                  {expediente.email && <p>Email: {expediente.email}</p>}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Link 
                  href={`/expediente/${expediente.id}`}
                  className="btn btn-primary text-xs px-3 py-1"
                >
                  Ver
                </Link>
                {!expediente.archivado && (
                  <Link 
                    href={`/expediente/${expediente.id}/editar`}
                    className="btn btn-secondary text-xs px-3 py-1"
                  >
                    Editar
                  </Link>
                )}
                {!expediente.archivado ? (
                  <button 
                    onClick={() => archivarExpediente(expediente.id)}
                    className="btn btn-danger text-xs px-3 py-1"
                  >
                    Archivar
                  </button>
                ) : (
                  <button 
                    onClick={() => desarchivarExpediente(expediente.id)}
                    className="btn btn-success text-xs px-3 py-1"
                  >
                    Desarchivar
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {filteredExpedientes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No se encontraron expedientes</p>
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
      />
      </div>
    </ProtectedRoute>
  );
}