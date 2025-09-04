import { useState, useEffect } from 'react';

const TOOTH_CONDITIONS = {
  normal: { color: '#ffffff', label: 'Normal' },
  caries: { color: '#ff4444', label: 'Caries' },
  restauracion: { color: '#4444ff', label: 'Restauración' },
  extraccion: { color: '#444444', label: 'Extracción' },
  protesis: { color: '#ff8800', label: 'Prótesis' },
  fractura: { color: '#8800ff', label: 'Fractura' },
  malposicion: { color: '#ff00ff', label: 'Malposición' },
  pendiente: { color: '#ffff00', label: 'Tratamiento Pendiente' }
};

const TEETH_NUMBERS = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
};

export default function Odontogram({ data = '{}', onChange }) {
  const [toothStates, setToothStates] = useState({});
  const [selectedCondition, setSelectedCondition] = useState('normal');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      setToothStates(parsed.toothStates || {});
      setNotes(parsed.notes || '');
    } catch (error) {
      console.error('Error parsing odontogram data:', error);
      setToothStates({});
      setNotes('');
    }
  }, [data]);

  const updateOdontogramData = (newToothStates, newNotes = notes) => {
    const newData = {
      toothStates: newToothStates,
      notes: newNotes
    };
    onChange(newData);
  };

  const handleToothClick = (toothNumber) => {
    const newToothStates = {
      ...toothStates,
      [toothNumber]: selectedCondition
    };
    setToothStates(newToothStates);
    updateOdontogramData(newToothStates);
  };

  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    updateOdontogramData(toothStates, newNotes);
  };

  const renderTooth = (toothNumber, position) => {
    const condition = toothStates[toothNumber] || 'normal';
    const conditionData = TOOTH_CONDITIONS[condition];
    
    return (
      <div
        key={toothNumber}
        className="tooth"
        onClick={() => handleToothClick(toothNumber)}
        style={{
          backgroundColor: conditionData.color,
          border: `2px solid ${condition === 'normal' ? '#333' : conditionData.color}`,
          color: condition === 'normal' ? '#333' : '#fff',
          cursor: 'pointer',
          width: '40px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          borderRadius: '8px',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
        title={`Diente ${toothNumber} - ${conditionData.label}`}
      >
        {toothNumber}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Odontograma</h3>
      </div>

      <div className="bg-white p-6 border-2 border-gray-200 rounded-lg">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Arcada Superior</h4>
            <div className="grid grid-cols-16 gap-2 justify-items-center">
              {TEETH_NUMBERS.upper.map(toothNumber => renderTooth(toothNumber, 'upper'))}
            </div>
          </div>

          <div className="border-t border-gray-300 my-4"></div>

          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Arcada Inferior</h4>
            <div className="grid grid-cols-16 gap-2 justify-items-center">
              {TEETH_NUMBERS.lower.map(toothNumber => renderTooth(toothNumber, 'lower'))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Condición Seleccionada</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(TOOTH_CONDITIONS).map(([key, condition]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCondition(key)}
                className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-all ${
                  selectedCondition === key 
                    ? 'border-dental-teal bg-dental-teal bg-opacity-10' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: condition.color }}
                />
                <span className="text-sm font-medium">{condition.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Observaciones y Notas Clínicas
          </label>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Registre observaciones adicionales sobre el estado dental del paciente..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dental-teal focus:border-dental-teal"
            rows="4"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Instrucciones:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Seleccione una condición de la lista y haga clic en el diente correspondiente</li>
            <li>• El odontograma se actualiza automáticamente</li>
            <li>• Use las observaciones para registrar detalles adicionales</li>
          </ul>
        </div>
      </div>
    </div>
  );
}