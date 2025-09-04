import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import OdontogramReadOnly from '../../../components/OdontogramReadOnly';
import SignatureDisplay from '../../../components/SignatureDisplay';
import Modal from '../../../components/Modal';
import useModal from '../../../hooks/useModal';

export default function VerExpediente() {
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;
  const { modal, closeModal, showConfirm, showSuccess, showError } = useModal();

  useEffect(() => {
    if (id) {
      fetchExpediente();
    }
  }, [id]);

  const fetchExpediente = async () => {
    try {
      const response = await fetch(`/api/expedientes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExpediente(data);
      } else {
        showError('Expediente no encontrado', 'El expediente solicitado no existe');
        setTimeout(() => router.push('/'), 2000);
      }
    } catch (error) {
      console.error('Error fetching expediente:', error);
      showError('Error de conexión', 'Error al cargar el expediente. Verifique su conexión.');
    } finally {
      setLoading(false);
    }
  };

  const archivarExpediente = async () => {
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
            setTimeout(() => router.push('/'), 1500);
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

  const desarchivarExpediente = async () => {
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
            setTimeout(() => window.location.reload(), 1500);
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

  const parseOdontogramData = (dataString) => {
    try {
      return typeof dataString === 'string' ? JSON.parse(dataString) : dataString;
    } catch {
      return { toothStates: {}, notes: '' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dental-teal mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando expediente...</p>
        </div>
      </div>
    );
  }

  if (!expediente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Expediente no encontrado</p>
          <Link href="/" className="btn btn-primary mt-4">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const odontogramData = parseOdontogramData(expediente.odontogram_data);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-4 md:py-8 px-3 md:px-0">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="dental-header">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  <Image
                    src="/images/dental-logo.png"
                    alt="Clínica Dental Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold">Clínica Dental</h1>
                  <p className="text-xs md:text-sm opacity-90">DRA. LAURA CAMPOS - UCR</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <h2 className="text-base md:text-lg font-bold">EXPEDIENTE CLÍNICO</h2>
                <p className="text-xs md:text-sm opacity-90">ID: {expediente.id}</p>
              </div>
            </div>
          </div>

          <div className="p-3 md:p-6 space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                {expediente.paciente}
              </h3>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {!expediente.archivado && (
                  <Link 
                    href={`/expediente/${id}/editar`}
                    className="btn btn-primary w-full sm:w-auto text-center"
                  >
                    Editar
                  </Link>
                )}
                {!expediente.archivado ? (
                  <button
                    onClick={archivarExpediente}
                    className="btn btn-danger w-full sm:w-auto"
                  >
                    Archivar
                  </button>
                ) : (
                  <button
                    onClick={desarchivarExpediente}
                    className="btn btn-success w-full sm:w-auto"
                  >
                    Desarchivar
                  </button>
                )}
                <Link href="/" className="btn btn-secondary w-full sm:w-auto text-center">
                  Volver
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  Información Personal
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Cédula:</strong> {expediente.cedula}</p>
                  <p><strong>Encargado:</strong> {expediente.encargado || 'No especificado'}</p>
                  <p><strong>Fecha de nacimiento:</strong> {expediente.fecha_nacimiento || 'No especificado'}</p>
                  <p><strong>Edad:</strong> {expediente.edad || 'No especificado'}</p>
                  <p><strong>Sexo:</strong> {expediente.sexo === 'M' ? 'Masculino' : expediente.sexo === 'F' ? 'Femenino' : 'No especificado'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  Información de Contacto
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Teléfono:</strong> {expediente.telefono || 'No especificado'}</p>
                  <p><strong>Dirección:</strong> {expediente.direccion || 'No especificado'}</p>
                  <p><strong>Contacto de emergencia:</strong> {expediente.contacto_emergencia || 'No especificado'}</p>
                  <p><strong>Email:</strong> {expediente.email || 'No especificado'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2">
                Historia Médica
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {[
                  { key: 'problemas_cardiacos', label: 'Problemas cardiacos' },
                  { key: 'enfermedades_rinon', label: 'Enfermedades del riñón' },
                  { key: 'enfermedades_higado', label: 'Enfermedades del hígado' },
                  { key: 'diabetes', label: 'Diabetes' },
                  { key: 'hipertension', label: 'Hipertensión' },
                  { key: 'epilepsia', label: 'Epilepsia' },
                  { key: 'problemas_nerviosos', label: 'Problemas nerviosos' },
                  { key: 'problemas_hemorragicos', label: 'Problemas hemorrágicos' },
                  { key: 'tomando_medicamentos', label: 'Está tomando medicamentos' },
                  { key: 'alergia_medicamento', label: 'Alergia a algún medicamento' },
                  { key: 'alergia_anestesia_dental', label: 'Alergia a la anestesia dental' },
                  { key: 'embarazada', label: 'Está embarazada' },
                  { key: 'problemas_tratamiento_dental', label: 'Problemas con algún tratamiento dental' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex justify-between">
                    <span>{label}:</span>
                    <span className={`font-semibold ${expediente[key] ? 'text-red-600' : 'text-green-600'}`}>
                      {expediente[key] ? 'Sí' : 'No'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2">
                Firma del Paciente
              </h4>
              <SignatureDisplay 
                signature={expediente.firma_paciente} 
                alt="Firma del paciente"
                placeholder="Sin firma del paciente"
                className="max-w-md"
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2">
                Odontograma
              </h4>
              <OdontogramReadOnly data={expediente.odontogram_data} />
            </div>

            {expediente.tratamientos && expediente.tratamientos.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  Tratamientos
                </h4>
                
                {/* Vista de tabla para desktop y tablet */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-dental-teal text-white">
                        <th className="p-3 text-left text-sm">Fecha</th>
                        <th className="p-3 text-left text-sm">Pieza</th>
                        <th className="p-3 text-left text-sm">Tratamiento Ejecutado</th>
                        <th className="p-3 text-left text-sm">Firma del Paciente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expediente.tratamientos.map((tratamiento, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3 text-sm">{tratamiento.fecha || '-'}</td>
                          <td className="p-3 text-sm">{tratamiento.pieza || '-'}</td>
                          <td className="p-3 text-sm">{tratamiento.tratamiento_ejecutado || '-'}</td>
                          <td className="p-3">
                            <SignatureDisplay 
                              signature={tratamiento.firma} 
                              alt="Firma del paciente"
                              placeholder="Sin firma"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista de cards para móvil */}
                <div className="md:hidden space-y-3">
                  {expediente.tratamientos.map((tratamiento, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Fecha:</span>
                          <span className="text-gray-900">{tratamiento.fecha || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Pieza:</span>
                          <span className="text-gray-900">{tratamiento.pieza || '-'}</span>
                        </div>
                        <div className="border-t pt-2">
                          <span className="font-medium text-gray-700">Tratamiento:</span>
                          <p className="text-gray-900 mt-1">{tratamiento.tratamiento_ejecutado || '-'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Firma:</span>
                          <div className="mt-2">
                            <SignatureDisplay 
                              signature={tratamiento.firma} 
                              alt="Firma del paciente"
                              placeholder="Sin firma"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 border-t pt-4">
              <p>Creado: {new Date(expediente.created_at).toLocaleDateString()}</p>
              <p>Última actualización: {new Date(expediente.updated_at).toLocaleDateString()}</p>
              {expediente.archivado && (
                <p className="text-red-600 font-semibold">Estado: Archivado</p>
              )}
            </div>
          </div>
        </div>
      </div>

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
  );
}