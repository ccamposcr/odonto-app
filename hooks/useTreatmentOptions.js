import { useState, useEffect } from 'react';

export default function useTreatmentOptions() {
  const [treatmentOptions, setTreatmentOptions] = useState([]);
  const [groupedTreatments, setGroupedTreatments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTreatmentOptions();
  }, []);

  const fetchTreatmentOptions = async () => {
    try {
      const response = await fetch('/api/admin/treatment-options');
      if (response.ok) {
        const data = await response.json();
        setTreatmentOptions(data.treatments);
        setGroupedTreatments(data.grouped);
      } else {
        throw new Error('Failed to fetch treatment options');
      }
    } catch (err) {
      console.error('Error fetching treatment options:', err);
      setError(err.message);
      
      // Fallback to hardcoded treatments if API fails
      const fallbackTreatments = [
        { id: 1, category: "Tipos de resina", treatment_name: "Resina CI", is_active: 1, display_order: 1 },
        { id: 2, category: "Tipos de resina", treatment_name: "Resina CII", is_active: 1, display_order: 2 },
        { id: 3, category: "Tipos de resina", treatment_name: "Resina CIII", is_active: 1, display_order: 3 },
        { id: 4, category: "Tipos de resina", treatment_name: "Resina CIV", is_active: 1, display_order: 4 },
        { id: 5, category: "Tipos de resina", treatment_name: "Resina CV", is_active: 1, display_order: 5 },
        { id: 6, category: "Limpieza", treatment_name: "Limpieza", is_active: 1, display_order: 6 },
        { id: 7, category: "Limpieza", treatment_name: "Limpieza con anestesia", is_active: 1, display_order: 7 },
        { id: 8, category: "Cirugía", treatment_name: "Extracción", is_active: 1, display_order: 8 },
        { id: 9, category: "Cirugía", treatment_name: "Extracción quirúrgica", is_active: 1, display_order: 9 },
        { id: 10, category: "Cirugía", treatment_name: "Cirugía", is_active: 1, display_order: 10 },
        { id: 11, category: "Prótesis", treatment_name: "Protesis parcial", is_active: 1, display_order: 11 },
        { id: 12, category: "Prótesis", treatment_name: "Protesis total", is_active: 1, display_order: 12 },
        { id: 13, category: "Prótesis", treatment_name: "Corona", is_active: 1, display_order: 13 },
        { id: 14, category: "Prótesis", treatment_name: "Puente", is_active: 1, display_order: 14 },
        { id: 15, category: "Especialidades", treatment_name: "Ortodoncia", is_active: 1, display_order: 15 },
        { id: 16, category: "Especialidades", treatment_name: "Tratamiento periodontal", is_active: 1, display_order: 16 },
        { id: 17, category: "Especialidades", treatment_name: "Endodoncia", is_active: 1, display_order: 17 },
        { id: 18, category: "Especialidades", treatment_name: "Endoposte", is_active: 1, display_order: 18 },
        { id: 19, category: "Estética", treatment_name: "Blanqueamiento láser", is_active: 1, display_order: 19 },
        { id: 20, category: "Estética", treatment_name: "Blanqueamiento de fundas", is_active: 1, display_order: 20 },
        { id: 21, category: "Implantología", treatment_name: "Implante dental", is_active: 1, display_order: 21 }
      ];
      
      const fallbackGrouped = fallbackTreatments.reduce((acc, treatment) => {
        if (!acc[treatment.category]) {
          acc[treatment.category] = [];
        }
        acc[treatment.category].push(treatment);
        return acc;
      }, {});
      
      setTreatmentOptions(fallbackTreatments);
      setGroupedTreatments(fallbackGrouped);
    } finally {
      setLoading(false);
    }
  };

  return { 
    treatmentOptions, 
    groupedTreatments, 
    loading, 
    error, 
    refetch: fetchTreatmentOptions 
  };
}