import { useState, useEffect } from 'react';
import Image from 'next/image';
import TreatmentTable from './TreatmentTable';
import Odontogram from './Odontogram';
import Modal from './Modal';
import SignatureCanvas from './SignatureCanvas';
import useModal from '../hooks/useModal';
import useMedicalFields from '../hooks/useMedicalFields';

export default function ExpedienteForm({ expediente = null, onSubmit }) {
  const { modal, closeModal, showError } = useModal();
  const { medicalFields, loading: medicalFieldsLoading } = useMedicalFields();
  const [formData, setFormData] = useState(() => {
    // Base form data
    const baseData = {
      cedula: expediente?.cedula || '',
      paciente: expediente?.paciente || '',
      encargado: expediente?.encargado || '',
      fecha_nacimiento: expediente?.fecha_nacimiento || '',
      edad: expediente?.edad || '',
      sexo: expediente?.sexo || '',
      telefono: expediente?.telefono || '',
      direccion: expediente?.direccion || '',
      contacto_emergencia: expediente?.contacto_emergencia || '',
      email: expediente?.email || '',
      firma_paciente: expediente?.firma_paciente || '',
      odontogram_data: expediente?.odontogram_data || '{}',
    };

    // Add default medical fields (for backwards compatibility)
    const defaultMedicalFields = [
      'problemas_cardiacos', 'enfermedades_rinon', 'enfermedades_higado', 'diabetes',
      'hipertension', 'epilepsia', 'problemas_nerviosos', 'problemas_hemorragicos',
      'tomando_medicamentos', 'alergia_medicamento', 'alergia_anestesia_dental',
      'embarazada', 'problemas_tratamiento_dental'
    ];

    defaultMedicalFields.forEach(field => {
      baseData[field] = Boolean(expediente?.[field]);
    });

    return baseData;
  });

  const [treatments, setTreatments] = useState(expediente?.tratamientos || []);

  // Update formData when medical fields are loaded
  useEffect(() => {
    if (!medicalFieldsLoading && medicalFields.length > 0) {
      setFormData(prev => {
        const newData = { ...prev };
        
        // Add any new medical fields that aren't already in the form data
        medicalFields.forEach(field => {
          if (!(field.field_key in newData)) {
            newData[field.field_key] = Boolean(expediente?.[field.field_key]);
          }
        });
        
        return newData;
      });
    }
  }, [medicalFields, medicalFieldsLoading, expediente]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.cedula.trim()) {
      showError('Campo obligatorio', 'La cédula es obligatoria');
      return;
    }
    
    if (!formData.paciente.trim()) {
      showError('Campo obligatorio', 'El nombre del paciente es obligatorio');
      return;
    }

    if (!/^\d+$/.test(formData.cedula.trim())) {
      showError('Formato incorrecto', 'La cédula debe contener solo números');
      return;
    }

    onSubmit({
      ...formData,
      tratamientos: treatments
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6 bg-white">
      <div className="dental-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <Image
                src="/images/dental-logo.png"
                alt="Clínica Dental Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold">Clínica Dental</h1>
              <p className="text-xs md:text-sm opacity-90">DRA. LAURA CAMPOS - UCR</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <h2 className="text-base md:text-lg font-bold">EXPEDIENTE CLÍNICO</h2>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-field">
              <label>Paciente *</label>
              <input
                type="text"
                name="paciente"
                value={formData.paciente}
                onChange={handleInputChange}
                required
                className="form-control"
              />
            </div>
            <div className="form-field">
              <label>Encargado</label>
              <input
                type="text"
                name="encargado"
                value={formData.encargado}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            <div className="form-field">
              <label>Cédula *</label>
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleInputChange}
                required
                disabled={!!expediente}
                className="form-control"
              />
            </div>
            <div className="form-field">
              <label>Fecha de nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            <div className="form-field">
              <label>Edad</label>
              <input
                type="number"
                name="edad"
                value={formData.edad}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            <div className="form-field">
              <label>Sexo</label>
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div className="form-field">
              <label>Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            <div className="form-field">
              <label>Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            <div className="form-field">
              <label>Contacto en caso de emergencia</label>
              <input
                type="text"
                name="contacto_emergencia"
                value={formData.contacto_emergencia}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="dental-header">
            <h3 className="text-base md:text-lg font-bold">HISTORIA MÉDICA</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3 md:gap-4 mt-4">
            {medicalFieldsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dental-teal mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Cargando campos médicos...</p>
              </div>
            ) : (
              medicalFields.map(({ field_key, field_label }) => (
                <div key={field_key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 border-b border-gray-100 pb-2">
                  <span className="text-sm md:text-base font-medium text-gray-700">{field_label}</span>
                  <div className="flex space-x-6">
                    <label className="flex items-center text-sm">
                      <input
                        type="radio"
                        name={field_key}
                        checked={formData[field_key] === true}
                        onChange={() => setFormData(prev => ({ ...prev, [field_key]: true }))}
                        className="mr-2 text-dental-teal"
                      />
                      <span className="font-medium">Sí</span>
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="radio"
                        name={field_key}
                        checked={formData[field_key] === false}
                        onChange={() => setFormData(prev => ({ ...prev, [field_key]: false }))}
                        className="mr-2 text-dental-teal"
                      />
                      <span className="font-medium">No</span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="form-field mt-4">
            <label>Firma del paciente:</label>
            <SignatureCanvas
              value={formData.firma_paciente}
              onChange={(signature) => setFormData(prev => ({ ...prev, firma_paciente: signature }))}
              width={350}
              height={120}
              placeholder="Firma del paciente"
              className="w-full"
            />
          </div>
        </div>

        <div className="form-section">
          <Odontogram 
            data={formData.odontogram_data}
            onChange={(data) => setFormData(prev => ({ ...prev, odontogram_data: JSON.stringify(data) }))}
          />
        </div>

        <div className="form-section">
          <TreatmentTable 
            treatments={treatments}
            onChange={setTreatments}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-secondary w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary w-full sm:w-auto order-1 sm:order-2"
          >
            {expediente ? 'Actualizar' : 'Crear'} Expediente
          </button>
        </div>
      </form>

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
}