import { useRef, useEffect, useState } from 'react';

export default function SignatureCanvas({ 
  value = '', 
  onChange, 
  width = 400, 
  height = 150,
  placeholder = "Firme aquí",
  className = ""
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Load existing signature if any
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value, width, height]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    
    // Handle both mouse and touch events
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    
    ctx.moveTo(
      (clientX - rect.left) * scaleX,
      (clientY - rect.top) * scaleY
    );
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    e.preventDefault(); // Prevent scrolling on touch devices
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const ctx = canvas.getContext('2d');
    
    // Handle both mouse and touch events
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    
    ctx.lineTo(
      (clientX - rect.left) * scaleX,
      (clientY - rect.top) * scaleY
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Save signature as base64
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    onChange(dataURL);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className={`signature-canvas-container ${className}`}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={`border-2 border-gray-300 rounded-lg cursor-crosshair bg-white ${
            hasSignature ? 'border-green-400' : 'border-gray-300'
          }`}
          style={{ touchAction: 'none' }} // Prevent default touch behaviors
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {/* Placeholder text when no signature */}
        {!hasSignature && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-sm"
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            {placeholder}
          </div>
        )}
      </div>
      
      {/* Clear button */}
      {hasSignature && (
        <button
          type="button"
          onClick={clearSignature}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 transition-colors text-sm"
        >
          Limpiar Firma
        </button>
      )}
      
      {/* Signature status */}
      <div className="mt-1 text-xs text-gray-500">
        {hasSignature ? (
          <span className="text-green-600">✓ Firma capturada</span>
        ) : (
          <span>Use mouse o dedo para firmar</span>
        )}
      </div>
    </div>
  );
}