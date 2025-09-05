import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import ExpedienteForm from '../../../components/ExpedienteForm';
import Modal from '../../../components/Modal';
import ProtectedRoute from '../../../components/ProtectedRoute';
import useModal from '../../../hooks/useModal';

export default function EditarExpediente() {
  const [expediente, setExpediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;
  const { modal, closeModal, showSuccess, showError } = useModal();

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

  const handleSubmit = async (data) => {
    try {
      const response = await fetch(`/api/expedientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showSuccess('¡Expediente actualizado!', 'El expediente se ha actualizado exitosamente');
        setTimeout(() => {
          router.push(`/expediente/${id}`);
        }, 1500);
      } else {
        const error = await response.json();
        showError('Error al actualizar', error.error);
      }
    } catch (error) {
      console.error('Error updating expediente:', error);
      showError('Error de conexión', 'Error al actualizar el expediente. Verifique su conexión.');
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
          <button 
            onClick={() => router.push('/')} 
            className="btn btn-primary mt-4"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-dental-teal text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-3 md:px-6 py-4">
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
                  <h1 className="text-xl md:text-2xl font-bold">Editar Expediente - {expediente.paciente}</h1>
                  <p className="text-xs md:text-sm text-dental-teal-100">ID: {expediente.id} | Cédula: {expediente.cedula}</p>
                </div>
              </div>
              <Link href="/" className="btn !bg-emerald-700 text-white hover:!bg-emerald-800 w-full sm:w-auto text-center font-semibold shadow-md transition-all">
                Volver al Inicio
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-8">
          <ExpedienteForm expediente={expediente} onSubmit={handleSubmit} />
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