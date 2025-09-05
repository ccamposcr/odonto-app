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
    updateOdontogramData(toothStates, newNotes.trim());
  };

  const renderToothSurface = (toothNumber, surface) => {
    const toothKey = `${toothNumber}`;
    const toothData = toothStates[toothKey] || {};
    const surfaceCondition = toothData[surface] || 'normal';
    const conditionData = TOOTH_CONDITIONS[surfaceCondition];
    
    const surfaceStyles = {
      O: { // Oclusal/Incisal - Top
        position: 'absolute',
        top: '1.5px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '65%',
        height: '22%',
        borderRadius: '3px 3px 0 0'
      },
      V: { // Vestibular - Left
        position: 'absolute',
        left: '1.5px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '22%',
        height: '65%',
        borderRadius: '3px 0 0 3px'
      },
      D: { // Distal - Right
        position: 'absolute',
        right: '1.5px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '22%',
        height: '65%',
        borderRadius: '0 3px 3px 0'
      },
      L: { // Lingual - Bottom
        position: 'absolute',
        bottom: '1.5px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '65%',
        height: '22%',
        borderRadius: '0 0 3px 3px'
      },
      M: { // Mesial - Center
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '45%',
        height: '45%',
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
          width: 'clamp(24px, 3.5vw, 42px)',
          height: 'clamp(28px, 4.2vw, 52px)',
          position: 'relative',
          border: '1.5px solid #333',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '1px 0.5px clamp(12px, 2vw, 20px) 0.5px',
          flexShrink: 0
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
            bottom: 'clamp(-14px, -1.4vw, -16px)',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(7px, 0.9vw, 9px)',
            fontWeight: 'bold',
            color: '#333',
            zIndex: 3,
            whiteSpace: 'nowrap'
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

      <div className="bg-white p-2 md:p-4 lg:p-6 border-2 border-gray-200 rounded-lg">
        <div className="space-y-4 md:space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2 md:mb-3 text-center">Arcada Superior</h4>
            <div className="w-full overflow-hidden">
              <div className="flex flex-wrap justify-center gap-x-0.5 gap-y-1 sm:gap-x-1 md:gap-x-1.5 max-w-full px-1">
                {TEETH_NUMBERS.upper.map(toothNumber => renderTooth(toothNumber, 'upper'))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 my-3 md:my-4"></div>

          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2 md:mb-3 text-center">Arcada Inferior</h4>
            <div className="w-full overflow-hidden">
              <div className="flex flex-wrap justify-center gap-x-0.5 gap-y-1 sm:gap-x-1 md:gap-x-1.5 max-w-full px-1">
                {TEETH_NUMBERS.lower.map(toothNumber => renderTooth(toothNumber, 'lower'))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Condición Seleccionada</h4>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(TOOTH_CONDITIONS).map(([key, condition]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCondition(key)}
                className={`flex items-center space-x-2 p-2 md:p-3 border-2 rounded-lg transition-all text-left text-xs md:text-sm hover:shadow-sm ${
                  selectedCondition === key 
                    ? 'border-dental-teal bg-dental-teal bg-opacity-10 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div 
                  className="w-3 h-3 md:w-4 md:h-4 rounded border flex-shrink-0"
                  style={{ backgroundColor: condition.color, borderColor: condition.border }}
                />
                <span className="font-medium leading-tight break-words">{condition.label}</span>
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