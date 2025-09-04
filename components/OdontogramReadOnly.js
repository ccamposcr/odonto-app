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

export default function OdontogramReadOnly({ data = '{}' }) {
  const [toothStates, setToothStates] = useState({});
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
        style={{
          ...surfaceStyles[surface],
          backgroundColor: conditionData.color,
          border: `1px solid ${conditionData.border}`,
          transition: 'all 0.2s ease',
          zIndex: surface === 'M' ? 2 : 1,
          pointerEvents: 'none' // Read-only mode
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
          margin: '2px 2px 25px 2px'
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

  const hasData = Object.keys(toothStates).length > 0 || notes.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Odontograma</h3>
        {!hasData && (
          <span className="text-sm text-gray-500 italic">No hay datos registrados</span>
        )}
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

      {/* Legend */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-600 mb-3">Leyenda de Condiciones:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(TOOTH_CONDITIONS).map(([key, condition]) => (
            <div
              key={key}
              className="flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded"
            >
              <div 
                className="w-4 h-4 rounded border flex-shrink-0"
                style={{ backgroundColor: condition.color, borderColor: condition.border }}
              />
              <span className="text-xs font-medium">{condition.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-600">
            Observaciones y Notas Clínicas:
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
          </div>
        </div>
      )}

      {/* Surface descriptions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Superficies dentales:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="text-xs text-blue-700 space-y-1">
            <p>• <strong>O (Arriba):</strong> Oclusal/Incisal - masticación</p>
            <p>• <strong>V (Izquierda):</strong> Vestibular - hacia mejillas</p>
            <p>• <strong>D (Derecha):</strong> Distal - alejada del centro</p>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• <strong>L (Abajo):</strong> Lingual - hacia lengua</p>
            <p>• <strong>M (Centro):</strong> Mesial - hacia el centro</p>
          </div>
        </div>
      </div>
    </div>
  );
}