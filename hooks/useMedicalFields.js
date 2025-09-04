import { useState, useEffect } from 'react';

export default function useMedicalFields() {
  const [medicalFields, setMedicalFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMedicalFields();
  }, []);

  const fetchMedicalFields = async () => {
    try {
      const response = await fetch('/api/admin/medical-history-fields');
      if (response.ok) {
        const fields = await response.json();
        // Only return active fields
        const activeFields = fields.filter(field => field.is_active);
        setMedicalFields(activeFields);
      } else {
        throw new Error('Failed to fetch medical fields');
      }
    } catch (err) {
      console.error('Error fetching medical fields:', err);
      setError(err.message);
      // Fallback to default fields if API fails
      setMedicalFields([
        { field_key: 'problemas_cardiacos', field_label: 'Problemas cardiacos', field_type: 'boolean' },
        { field_key: 'enfermedades_rinon', field_label: 'Enfermedades del riñón', field_type: 'boolean' },
        { field_key: 'enfermedades_higado', field_label: 'Enfermedades del hígado', field_type: 'boolean' },
        { field_key: 'diabetes', field_label: 'Diabetes', field_type: 'boolean' },
        { field_key: 'hipertension', field_label: 'Hipertensión', field_type: 'boolean' },
        { field_key: 'epilepsia', field_label: 'Epilepsia', field_type: 'boolean' },
        { field_key: 'problemas_nerviosos', field_label: 'Problemas nerviosos', field_type: 'boolean' },
        { field_key: 'problemas_hemorragicos', field_label: 'Problemas hemorrágicos', field_type: 'boolean' },
        { field_key: 'tomando_medicamentos', field_label: 'Está tomando medicamentos', field_type: 'boolean' },
        { field_key: 'alergia_medicamento', field_label: 'Alergia a algún medicamento', field_type: 'boolean' },
        { field_key: 'alergia_anestesia_dental', field_label: 'Alergia a la anestesia dental', field_type: 'boolean' },
        { field_key: 'embarazada', field_label: 'Está embarazada', field_type: 'boolean' },
        { field_key: 'problemas_tratamiento_dental', field_label: 'Problemas con algún tratamiento dental', field_type: 'boolean' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { medicalFields, loading, error, refetch: fetchMedicalFields };
}