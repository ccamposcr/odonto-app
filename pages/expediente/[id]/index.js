import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function VerExpediente() {
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

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
        alert('Expediente no encontrado');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching expediente:', error);
      alert('Error al cargar el expediente');
    } finally {
      setLoading(false);
    }
  };

  const archivarExpediente = async () => {
    if (!confirm('¿Está seguro que desea archivar este expediente?')) return;
    
    try {
      const response = await fetch(`/api/expedientes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivado: true })
      });
      
      if (response.ok) {
        alert('Expediente archivado exitosamente');
        router.push('/');
      } else {
        alert('Error al archivar el expediente');
      }
    } catch (error) {
      console.error('Error archiving expediente:', error);
      alert('Error al archivar el expediente');
    }
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
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="dental-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-dental-teal text-xl font-bold">🦷</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Clínica Dental</h1>
                  <p className="text-sm opacity-90">DRA. LAURA CAMPOS - UCR</p>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold">EXPEDIENTE CLÍNICO</h2>
                <p className="text-sm opacity-90">ID: {expediente.id}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">
                {expediente.paciente}
              </h3>
              <div className="flex space-x-3">
                <Link 
                  href={`/expediente/${id}/editar`}
                  className="btn btn-primary"
                >
                  Editar
                </Link>
                {!expediente.archivado && (
                  <button
                    onClick={archivarExpediente}
                    className="btn btn-danger"
                  >
                    Archivar
                  </button>
                )}
                <Link href="/" className="btn btn-secondary">
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

            {odontogramData.notes && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  Observaciones Odontológicas
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {odontogramData.notes}
                </p>
              </div>
            )}

            {expediente.tratamientos && expediente.tratamientos.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  Tratamientos
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-dental-teal text-white">
                        <th className="p-3 text-left">Fecha</th>
                        <th className="p-3 text-left">Pieza</th>
                        <th className="p-3 text-left">Tratamiento Ejecutado</th>
                        <th className="p-3 text-left">Firma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expediente.tratamientos.map((tratamiento, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3">{tratamiento.fecha || '-'}</td>
                          <td className="p-3">{tratamiento.pieza || '-'}</td>
                          <td className="p-3">{tratamiento.tratamiento_ejecutado || '-'}</td>
                          <td className="p-3">{tratamiento.firma || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
    </div>
  );
}