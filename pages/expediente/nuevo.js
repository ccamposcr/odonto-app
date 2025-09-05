import { useRouter } from 'next/router';
import ExpedienteForm from '../../components/ExpedienteForm';
import Modal from '../../components/Modal';
import ProtectedRoute from '../../components/ProtectedRoute';
import useModal from '../../hooks/useModal';

export default function NuevoExpediente() {
  const router = useRouter();
  const { modal, closeModal, showSuccess, showError } = useModal();

  const handleSubmit = async (data) => {
    try {
      const response = await fetch('/api/expedientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('¡Expediente creado!', 'El expediente se ha creado exitosamente');
        setTimeout(() => {
          router.push(`/expediente/${result.id}`);
        }, 1500);
      } else {
        const error = await response.json();
        showError('Error al crear', error.error);
      }
    } catch (error) {
      console.error('Error creating expediente:', error);
      showError('Error de conexión', 'Error al crear el expediente. Verifique su conexión.');
    }
  };

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        <ExpedienteForm onSubmit={handleSubmit} />
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
    </ProtectedRoute>
  );
}