import { useState, useEffect } from 'react';

const TOOTH_CONDITIONS = {
  normal: { color: '#ffffff', label: 'Normal', border: '#333' },
  caries: { color: '#ff4444', label: 'Caries', border: '#cc0000' },
  restauracion: { color: '#4444ff', label: 'Restauración', border: '#0000cc' },
  extraccion: { color: '#444444', label: 'Extracción', border: '#000000' },
  protesis: { color: '#ff8800', label: 'Prótesis', border: '#cc6600' },
  fractura: { color: '#8800ff', label: 'Fractura', border: '#6600cc' },
  malposicion: { color: '#ff00ff', label: 'Malposición', border: '#cc00cc' },
  pendiente: { color: '#ffff00', label: 'Tratamiento Pendiente', border: '#cccc00' }
};

const TEETH_NUMBERS = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
};

const TOOTH_SURFACES = {
  O: { label: 'Oclusal/Incisal', position: 'top' },
  V: { label: 'Vestibular/Labial', position: 'left' },
  D: { label: 'Distal', position: 'right' },
  L: { label: 'Lingual/Palatina', position: 'bottom' },
  M: { label: 'Mesial', position: 'center' }
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

  const handleSurfaceClick = (toothNumber, surface) => {
    const toothKey = `${toothNumber}`;
    const currentTooth = toothStates[toothKey] || {};
    
    const newToothStates = {
      ...toothStates,
      [toothKey]: {
        ...currentTooth,
        [surface]: selectedCondition
      }
    };
    
    setToothStates(newToothStates);
    updateOdontogramData(newToothStates);
  };

  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    updateOdontogramData(toothStates, newNotes);
  };

  const renderToothSurface = (toothNumber, surface) => {
    const toothKey = `${toothNumber}`;
    const toothData = toothStates[toothKey] || {};
    const surfaceCondition = toothData[surface] || 'normal';
    const conditionData = TOOTH_CONDITIONS[surfaceCondition];
    
    const surfaceStyles = {
      O: { // Oclusal/Incisal - Top
        position: 'absolute',
        top: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '20%',
        borderRadius: '4px 4px 0 0'
      },
      V: { // Vestibular - Left
        position: 'absolute',
        left: '2px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '20%',
        height: '60%',
        borderRadius: '4px 0 0 4px'
      },
      D: { // Distal - Right
        position: 'absolute',
        right: '2px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '20%',
        height: '60%',
        borderRadius: '0 4px 4px 0'
      },
      L: { // Lingual - Bottom
        position: 'absolute',
        bottom: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '20%',
        borderRadius: '0 0 4px 4px'
      },
      M: { // Mesial - Center
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '40%',
        height: '40%',
        borderRadius: '50%'
      }
    };

    return (
      <div
        key={`${toothNumber}-${surface}`}
        onClick={(e) => {
          e.stopPropagation();
          handleSurfaceClick(toothNumber, surface);
        }}
        style={{
          ...surfaceStyles[surface],
          backgroundColor: conditionData.color,
          border: `1px solid ${conditionData.border}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: surface === 'M' ? 2 : 1
        }}
        title={`Diente ${toothNumber} - ${TOOTH_SURFACES[surface].label} - ${conditionData.label}`}
      />
    );
  };

  const renderTooth = (toothNumber, position) => {
    return (
      <div
        key={toothNumber}
        className="tooth-container"
        style={{
          width: '50px',
          height: '60px',
          position: 'relative',
          border: '2px solid #333',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '2px'
        }}
      >
        {/* Render all tooth surfaces */}
        {Object.keys(TOOTH_SURFACES).map(surface => 
          renderToothSurface(toothNumber, surface)
        )}
        
        {/* Tooth number */}
        <div
          style={{
            position: 'absolute',
            bottom: '-18px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#333',
            zIndex: 3
          }}
        >
          {toothNumber}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Odontograma</h3>
      </div>

      <div className="bg-white p-6 border-2 border-gray-200 rounded-lg">
        <div className="space-y-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-4">Arcada Superior</h4>
            <div className="flex flex-wrap justify-center gap-1">
              {TEETH_NUMBERS.upper.map(toothNumber => renderTooth(toothNumber, 'upper'))}
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-4">Arcada Inferior</h4>
            <div className="flex flex-wrap justify-center gap-1">
              {TEETH_NUMBERS.lower.map(toothNumber => renderTooth(toothNumber, 'lower'))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Condición Seleccionada</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(TOOTH_CONDITIONS).map(([key, condition]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCondition(key)}
                className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-all text-left ${
                  selectedCondition === key 
                    ? 'border-dental-teal bg-dental-teal bg-opacity-10' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div 
                  className="w-4 h-4 rounded border flex-shrink-0"
                  style={{ backgroundColor: condition.color, borderColor: condition.border }}
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
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Instrucciones de Uso:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Cómo usar:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Seleccione una condición</strong> de la lista arriba</li>
                <li>• <strong>Haga clic directamente</strong> en la superficie del diente que desea marcar</li>
                <li>• Cada superficie puede tener una condición diferente</li>
                <li>• El odontograma se guarda automáticamente</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Superficies dentales:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>O (Arriba):</strong> Oclusal/Incisal - masticación</li>
                <li>• <strong>V (Izquierda):</strong> Vestibular - hacia mejillas</li>
                <li>• <strong>D (Derecha):</strong> Distal - alejada del centro</li>
                <li>• <strong>L (Abajo):</strong> Lingual - hacia lengua</li>
                <li>• <strong>M (Centro):</strong> Mesial - hacia el centro</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}