import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
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
                  <h1 className="text-xl md:text-2xl font-bold">Nuevo Expediente</h1>
                  <p className="text-xs md:text-sm text-dental-teal-100">DRA. LAURA CAMPOS - UCR</p>
                </div>
              </div>
              <Link href="/" className="btn !bg-emerald-700 text-white hover:!bg-emerald-800 w-full sm:w-auto text-center font-semibold shadow-md transition-all">
                Volver al Inicio
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-8">
          <ExpedienteForm onSubmit={handleSubmit} />
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