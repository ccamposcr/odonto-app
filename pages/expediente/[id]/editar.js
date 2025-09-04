import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ExpedienteForm from '../../../components/ExpedienteForm';
import Modal from '../../../components/Modal';
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Editar Expediente - {expediente.paciente}
          </h1>
          <p className="text-gray-600">ID: {expediente.id} | Cédula: {expediente.cedula}</p>
        </div>
        <ExpedienteForm expediente={expediente} onSubmit={handleSubmit} />
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