import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function TreatmentTable({ treatments = [], onChange }) {
  const addTreatment = () => {
    const newTreatment = {
      id: Date.now(),
      fecha: '',
      pieza: '',
      tratamiento_ejecutado: '',
      firma: ''
    };
    onChange([...treatments, newTreatment]);
  };

  const removeTreatment = (id) => {
    onChange(treatments.filter(t => t.id !== id));
  };

  const updateTreatment = (id, field, value) => {
    onChange(treatments.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Tratamientos</h3>
        <button
          type="button"
          onClick={addTreatment}
          className="flex items-center space-x-2 px-4 py-2 bg-dental-teal text-white rounded-lg hover:bg-dental-dark-teal transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Agregar Tratamiento</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="treatment-table w-full">
          <thead>
            <tr>
              <th className="bg-dental-teal text-white p-3 text-left">Fecha</th>
              <th className="bg-dental-teal text-white p-3 text-left">Pieza</th>
              <th className="bg-dental-teal text-white p-3 text-left">Tratamiento Ejecutado</th>
              <th className="bg-dental-teal text-white p-3 text-left">Firma</th>
              <th className="bg-dental-teal text-white p-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {treatments.map((treatment, index) => (
              <tr key={treatment.id || index} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  <input
                    type="date"
                    value={treatment.fecha || ''}
                    onChange={(e) => updateTreatment(treatment.id || index, 'fecha', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-dental-teal focus:border-dental-teal"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={treatment.pieza || ''}
                    onChange={(e) => updateTreatment(treatment.id || index, 'pieza', e.target.value)}
                    placeholder="Ej: 11, 21, 36"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-dental-teal focus:border-dental-teal"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={treatment.tratamiento_ejecutado || ''}
                    onChange={(e) => updateTreatment(treatment.id || index, 'tratamiento_ejecutado', e.target.value)}
                    placeholder="Descripción del tratamiento"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-dental-teal focus:border-dental-teal"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={treatment.firma || ''}
                    onChange={(e) => updateTreatment(treatment.id || index, 'firma', e.target.value)}
                    placeholder="Firma del profesional"
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-dental-teal focus:border-dental-teal"
                  />
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeTreatment(treatment.id || index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar tratamiento"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {treatments.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  No hay tratamientos registrados. Haga clic en "Agregar Tratamiento" para añadir uno.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}