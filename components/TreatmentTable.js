import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import SignatureCanvas from './SignatureCanvas';
import useTreatmentOptions from '../hooks/useTreatmentOptions';

const TOOTH_NUMBERS = [
  // Arcada Superior
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  // Arcada Inferior  
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
];


export default function TreatmentTable({ treatments = [], onChange }) {
  const { groupedTreatments, loading: treatmentsLoading } = useTreatmentOptions();
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

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="treatment-table w-full">
          <thead>
            <tr>
              <th className="bg-dental-teal text-white p-3 text-left">Fecha</th>
              <th className="bg-dental-teal text-white p-3 text-left">Pieza</th>
              <th className="bg-dental-teal text-white p-3 text-left">Tratamiento Ejecutado</th>
              <th className="bg-dental-teal text-white p-3 text-left">Firma del Paciente</th>
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
                  <select
                    value={treatment.pieza || ''}
                    onChange={(e) => updateTreatment(treatment.id || index, 'pieza', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-dental-teal focus:border-dental-teal"
                  >
                    <option value="">Seleccionar pieza</option>
                    <optgroup label="Arcada Superior">
                      {TOOTH_NUMBERS.slice(0, 16).map(toothNumber => (
                        <option key={toothNumber} value={toothNumber}>
                          {toothNumber}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Arcada Inferior">
                      {TOOTH_NUMBERS.slice(16, 32).map(toothNumber => (
                        <option key={toothNumber} value={toothNumber}>
                          {toothNumber}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </td>
                <td className="p-2">
                  <select
                    value={treatment.tratamiento_ejecutado || ''}
                    onChange={(e) => updateTreatment(treatment.id || index, 'tratamiento_ejecutado', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-dental-teal focus:border-dental-teal"
                    disabled={treatmentsLoading}
                  >
                    <option value="">
                      {treatmentsLoading ? 'Cargando...' : 'Seleccionar tratamiento'}
                    </option>
                    {!treatmentsLoading && Object.entries(groupedTreatments).map(([category, treatments]) => (
                      <optgroup key={category} label={category}>
                        {treatments.map((treatmentOption) => (
                          <option key={treatmentOption.id} value={treatmentOption.treatment_name}>
                            {treatmentOption.treatment_name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <SignatureCanvas
                    value={treatment.firma || ''}
                    onChange={(signature) => updateTreatment(treatment.id || index, 'firma', signature)}
                    width={200}
                    height={80}
                    placeholder="Firma del paciente"
                    className="signature-small"
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

      {/* Mobile card view */}
      <div className="lg:hidden space-y-4">
        {treatments.map((treatment, index) => (
          <div key={treatment.id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-semibold text-dental-teal">
                Tratamiento #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeTreatment(treatment.id || index)}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                title="Eliminar tratamiento"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={treatment.fecha || ''}
                  onChange={(e) => updateTreatment(treatment.id || index, 'fecha', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-dental-teal focus:border-dental-teal text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pieza
                </label>
                <select
                  value={treatment.pieza || ''}
                  onChange={(e) => updateTreatment(treatment.id || index, 'pieza', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-dental-teal focus:border-dental-teal text-sm"
                >
                  <option value="">Seleccionar pieza</option>
                  <optgroup label="Arcada Superior">
                    {TOOTH_NUMBERS.slice(0, 16).map(toothNumber => (
                      <option key={toothNumber} value={toothNumber}>
                        {toothNumber}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Arcada Inferior">
                    {TOOTH_NUMBERS.slice(16, 32).map(toothNumber => (
                      <option key={toothNumber} value={toothNumber}>
                        {toothNumber}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tratamiento Ejecutado
                </label>
                <select
                  value={treatment.tratamiento_ejecutado || ''}
                  onChange={(e) => updateTreatment(treatment.id || index, 'tratamiento_ejecutado', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-dental-teal focus:border-dental-teal text-sm"
                  disabled={treatmentsLoading}
                >
                  <option value="">
                    {treatmentsLoading ? 'Cargando...' : 'Seleccionar tratamiento'}
                  </option>
                  {!treatmentsLoading && Object.entries(groupedTreatments).map(([category, treatments]) => (
                    <optgroup key={category} label={category}>
                      {treatments.map((treatmentOption) => (
                        <option key={treatmentOption.id} value={treatmentOption.treatment_name}>
                          {treatmentOption.treatment_name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firma del Paciente
                </label>
                <div className="flex justify-center">
                  <SignatureCanvas
                    value={treatment.firma || ''}
                    onChange={(signature) => updateTreatment(treatment.id || index, 'firma', signature)}
                    width={280}
                    height={100}
                    placeholder="Firma del paciente"
                    className="w-full max-w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {treatments.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <p className="text-sm">No hay tratamientos registrados.</p>
            <p className="text-sm mt-1">Haga clic en "Agregar Tratamiento" para añadir uno.</p>
          </div>
        )}
      </div>
    </div>
  );
}