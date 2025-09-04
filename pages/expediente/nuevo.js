import { useRouter } from 'next/router';
import ExpedienteForm from '../../components/ExpedienteForm';

export default function NuevoExpediente() {
  const router = useRouter();

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
        alert('Expediente creado exitosamente');
        router.push(`/expediente/${result.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating expediente:', error);
      alert('Error al crear el expediente');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        <ExpedienteForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}