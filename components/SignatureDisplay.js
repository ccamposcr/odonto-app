export default function SignatureDisplay({ signature, alt = "Firma", className = "", placeholder = "Sin firma" }) {
  // Check if signature exists and is in base64 format
  if (!signature || signature.trim() === '') {
    return (
      <div className={`signature-display-placeholder ${className}`}>
        <div className="flex items-center justify-center h-12 bg-gray-50 border border-gray-200 rounded text-gray-400 text-sm">
          {placeholder}
        </div>
      </div>
    );
  }

  // If it's base64 data, display as image
  if (signature.startsWith('data:image/')) {
    return (
      <div className={`signature-display ${className}`}>
        <div className="border border-gray-300 rounded p-2 bg-white">
          <img 
            src={signature} 
            alt={alt}
            className="max-w-full h-auto max-h-20 object-contain"
            style={{ minHeight: '40px' }}
          />
        </div>
        <div className="text-xs text-green-600 mt-1">✓ Firma registrada</div>
      </div>
    );
  }

  // Fallback for legacy text signatures
  return (
    <div className={`signature-display-text ${className}`}>
      <div className="border border-gray-200 rounded p-2 bg-gray-50">
        <p className="text-sm text-gray-700 italic">{signature}</p>
      </div>
      <div className="text-xs text-gray-500 mt-1">Firma de texto</div>
    </div>
  );
}