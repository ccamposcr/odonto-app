import { useState } from 'react';
import TreatmentTable from './TreatmentTable';
import Odontogram from './Odontogram';

export default function ExpedienteForm({ expediente = null, onSubmit }) {
  const [formData, setFormData] = useState({
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
    problemas_cardiacos: expediente?.problemas_cardiacos || false,
    enfermedades_rinon: expediente?.enfermedades_rinon || false,
    enfermedades_higado: expediente?.enfermedades_higado || false,
    diabetes: expediente?.diabetes || false,
    hipertension: expediente?.hipertension || false,
    epilepsia: expediente?.epilepsia || false,
    problemas_nerviosos: expediente?.problemas_nerviosos || false,
    problemas_hemorragicos: expediente?.problemas_hemorragicos || false,
    tomando_medicamentos: expediente?.tomando_medicamentos || false,
    alergia_medicamento: expediente?.alergia_medicamento || false,
    alergia_anestesia_dental: expediente?.alergia_anestesia_dental || false,
    embarazada: expediente?.embarazada || false,
    problemas_tratamiento_dental: expediente?.problemas_tratamiento_dental || false,
    firma_paciente: expediente?.firma_paciente || '',
    odontogram_data: expediente?.odontogram_data || '{}',
  });

  const [treatments, setTreatments] = useState(expediente?.tratamientos || []);

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
      alert('La cédula es obligatoria');
      return;
    }
    
    if (!formData.paciente.trim()) {
      alert('El nombre del paciente es obligatorio');
      return;
    }

    if (!/^\d+$/.test(formData.cedula.trim())) {
      alert('La cédula debe contener solo números');
      return;
    }

    onSubmit({
      ...formData,
      tratamientos: treatments
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="dental-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-dental-teal text-xl font-bold">🦷</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Clínica Dental</h1>
              <p className="text-sm opacity-90">DRA. LAURA CAMPOS - UCR</p>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold">EXPEDIENTE CLÍNICO</h2>
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
            <h3 className="text-lg font-bold">HISTORIA MÉDICA</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              { key: 'problemas_cardiacos', label: 'Problemas cardiacos' },
              { key: 'enfermedades_rinon', label: 'Enfermedades del riñón' },
              { key: 'enfermedades_higado', label: 'Enfermedades del hígado' },
              { key: 'diabetes', label: 'Diabetes' },
              { key: 'hipertension', label: 'Hipertensión' },
              { key: 'epilepsia', label: 'Epilepsia' },
              { key: 'problemas_nerviosos', label: 'Problemas nerviosos' },
              { key: 'problemas_hemorragicos', label: 'Problemas hemorrágicos' },
              { key: 'tomando_medicamentos', label: 'Está tomando medicamentos' },
              { key: 'alergia_medicamento', label: 'Alergia a algún medicamento' },
              { key: 'alergia_anestesia_dental', label: 'Alergia a la anestesia dental' },
              { key: 'embarazada', label: 'Está embarazada' },
              { key: 'problemas_tratamiento_dental', label: 'Problemas con algún tratamiento dental' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-4">
                <span className="flex-1">{label}</span>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={key}
                      checked={formData[key] === true}
                      onChange={() => setFormData(prev => ({ ...prev, [key]: true }))}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={key}
                      checked={formData[key] === false}
                      onChange={() => setFormData(prev => ({ ...prev, [key]: false }))}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="form-field mt-4">
            <label>Firma del paciente:</label>
            <input
              type="text"
              name="firma_paciente"
              value={formData.firma_paciente}
              onChange={handleInputChange}
              className="form-control"
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

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            {expediente ? 'Actualizar' : 'Crear'} Expediente
          </button>
        </div>
      </form>
    </div>
  );
}