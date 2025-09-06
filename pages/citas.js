import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CalendarIcon, 
  ClockIcon, 
  PlusIcon, 
  PencilIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import ProtectedRoute from '../components/ProtectedRoute';
import Modal from '../components/Modal';
import useModal from '../hooks/useModal';

const ESTADOS_CITA = {
  'programada': { label: 'Programada', color: 'bg-blue-100 text-blue-800' },
  'confirmada': { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
  'en_proceso': { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-800' },
  'completada': { label: 'Completada', color: 'bg-emerald-100 text-emerald-800' },
  'cancelada': { label: 'Cancelada', color: 'bg-red-100 text-red-800' }
};

const HORAS_DIA = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export default function CitasPage() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaCalendario, setVistaCalendario] = useState('semana'); // 'dia', 'semana', 'mes'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientData, setNewPatientData] = useState({ cedula: '', paciente: '' });
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [blockedDays, setBlockedDays] = useState(new Set()); // Set of blocked date strings (YYYY-MM-DD)
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null); // Appointment being rescheduled
  const { modal, closeModal, showSuccess, showError, showConfirm } = useModal();

  useEffect(() => {
    fetchCitas();
  }, [fechaSeleccionada, vistaCalendario]);

  const fetchCitas = async () => {
    try {
      setLoading(true);
      let url = '/api/citas';
      
      // Para vista de día, filtrar por fecha específica
      if (vistaCalendario === 'dia') {
        const fechaStr = fechaSeleccionada.getFullYear() + '-' + 
          String(fechaSeleccionada.getMonth() + 1).padStart(2, '0') + '-' + 
          String(fechaSeleccionada.getDate()).padStart(2, '0');
        url += `?fecha=${fechaStr}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCitas(data);
      } else {
        showError('Error', 'No se pudieron cargar las citas');
      }
    } catch (error) {
      console.error('Error fetching citas:', error);
      showError('Error de conexión', 'Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`/api/expedientes/search?q=${encodeURIComponent(query.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchPatients(value);
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.paciente);
    setSearchResults([]);
    setShowNewPatientForm(false);
  };

  const handleNewPatientSubmit = async (e) => {
    e.preventDefault();
    if (!newPatientData.cedula || !newPatientData.paciente) {
      showError('Error', 'Cédula y nombre son obligatorios');
      return;
    }

    try {
      const response = await fetch('/api/expedientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedula: newPatientData.cedula.trim(),
          paciente: newPatientData.paciente.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        const newPatient = {
          id: result.id,
          cedula: newPatientData.cedula.trim(),
          paciente: newPatientData.paciente.trim()
        };
        
        setSelectedPatient(newPatient);
        setSearchQuery(newPatient.paciente);
        setNewPatientData({ cedula: '', paciente: '' });
        setShowNewPatientForm(false);
        showSuccess('Paciente creado', 'El expediente se creó exitosamente');
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Error al crear el paciente');
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      showError('Error de conexión', 'Error al crear el paciente');
    }
  };

  const handleBookAppointment = async (appointmentData) => {
    if (!selectedPatient) {
      showError('Error', 'Debe seleccionar un paciente');
      return;
    }

    if (!selectedTimeSlot) {
      showError('Error', 'Debe seleccionar un horario');
      return;
    }

    try {
      const method = editingAppointment ? 'PUT' : 'POST';
      const url = editingAppointment ? `/api/citas/${editingAppointment.id}` : '/api/citas';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: selectedPatient.id,
          fecha: selectedTimeSlot.fecha,
          hora_inicio: selectedTimeSlot.hora_inicio,
          hora_fin: selectedTimeSlot.hora_fin,
          notas: appointmentData.notas || null
        })
      });

      if (response.ok) {
        showSuccess(
          editingAppointment ? 'Cita actualizada' : 'Cita programada',
          editingAppointment ? 'La cita se actualizó exitosamente' : 'La cita se programó exitosamente'
        );
        closeBookingModal();
        fetchCitas();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Error al procesar la cita');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      showError('Error de conexión', 'Error al procesar la cita');
    }
  };

  const handleCancelAppointment = (appointment) => {
    showConfirm(
      'Cancelar Cita',
      `¿Está seguro que desea cancelar la cita con ${appointment.paciente}?\\n\\nFecha: ${formatDate(appointment.fecha)}\\nHora: ${appointment.hora_inicio} - ${appointment.hora_fin}`,
      async () => {
        try {
          const response = await fetch(`/api/citas/${appointment.id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            showSuccess('Cita cancelada', 'La cita se canceló exitosamente');
            fetchCitas();
          } else {
            const errorData = await response.json();
            showError('Error', errorData.error || 'Error al cancelar la cita');
          }
        } catch (error) {
          console.error('Error canceling appointment:', error);
          showError('Error de conexión', 'Error al cancelar la cita');
        }
      }
    );
  };

  const openBookingModal = (timeSlot = null, appointment = null) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setSelectedPatient({
        id: appointment.expediente_id,
        cedula: appointment.cedula,
        paciente: appointment.paciente
      });
      setSearchQuery(appointment.paciente);
      setSelectedTimeSlot({
        fecha: appointment.fecha,
        hora_inicio: appointment.hora_inicio,
        hora_fin: appointment.hora_fin
      });
    } else {
      setEditingAppointment(null);
      setSelectedPatient(null);
      setSearchQuery('');
      setSelectedTimeSlot(timeSlot);
    }
    
    setSearchResults([]);
    setShowNewPatientForm(false);
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedTimeSlot(null);
    setSelectedPatient(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowNewPatientForm(false);
    setNewPatientData({ cedula: '', paciente: '' });
    setEditingAppointment(null);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    const time24 = timeStr.substring(0, 5);
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(fechaSeleccionada);
    
    if (vistaCalendario === 'dia') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (vistaCalendario === 'semana') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (vistaCalendario === 'mes') {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    
    setFechaSeleccionada(newDate);
  };

  const toggleDayBlock = (date) => {
    const dateStr = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    
    setBlockedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  };

  const isDayBlocked = (date) => {
    const dateStr = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    return blockedDays.has(dateStr);
  };

  const handleRescheduleAppointment = (appointment) => {
    setReschedulingAppointment(appointment);
    showSuccess('Modo reagendar activado', 'Haga clic en cualquier horario disponible para mover la cita');
  };

  const cancelReschedule = () => {
    setReschedulingAppointment(null);
  };

  const confirmReschedule = async (newDate, newHora) => {
    if (!reschedulingAppointment) return;

    try {
      const horaFin = HORAS_DIA[HORAS_DIA.indexOf(newHora) + 1] || '18:30';
      const response = await fetch(`/api/citas/${reschedulingAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expediente_id: reschedulingAppointment.expediente_id,
          fecha: newDate,
          hora_inicio: newHora,
          hora_fin: horaFin,
          notas: reschedulingAppointment.notas || null
        })
      });

      if (response.ok) {
        showSuccess('Cita reagendada', 'La cita se movió exitosamente a la nueva fecha y hora');
        setReschedulingAppointment(null);
        fetchCitas();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Error al reagendar la cita');
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      showError('Error de conexión', 'Error al reagendar la cita');
    }
  };

  const getWeekDates = (date) => {
    const startOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
      weekDates.push(currentDay);
    }
    return weekDates;
  };

  const getCitasForDateAndTime = (fecha, hora) => {
    const fechaStr = fecha.getFullYear() + '-' + 
      String(fecha.getMonth() + 1).padStart(2, '0') + '-' + 
      String(fecha.getDate()).padStart(2, '0');
    return citas.filter(cita => 
      cita.fecha === fechaStr && 
      cita.hora_inicio <= hora && 
      cita.hora_fin > hora &&
      cita.estado !== 'cancelada'
    );
  };

  const isTimeSlotAvailable = (fecha, hora) => {
    const citasEnHora = getCitasForDateAndTime(fecha, hora);
    return citasEnHora.length === 0;
  };

  const handleTimeSlotClick = (fecha, hora) => {
    // Si estamos en modo reagendar
    if (reschedulingAppointment) {
      // Verificar si el día está bloqueado
      if (isDayBlocked(fecha)) {
        showError('Día bloqueado', 'No se puede reagendar a días bloqueados');
        return;
      }

      // Verificar si ya hay una cita en esta hora
      const citasEnHora = getCitasForDateAndTime(fecha, hora);
      if (citasEnHora.length > 0) {
        showError('Horario ocupado', 'Ya hay una cita programada en este horario');
        return;
      }

      // Confirmar el reagendado
      const fechaStr = fecha.getFullYear() + '-' + 
        String(fecha.getMonth() + 1).padStart(2, '0') + '-' + 
        String(fecha.getDate()).padStart(2, '0');
      
      showConfirm(
        'Confirmar reagendado',
        `¿Confirma mover la cita de ${reschedulingAppointment.paciente} a:\n\nFecha: ${formatDate(fechaStr)}\nHora: ${hora}?`,
        () => confirmReschedule(fechaStr, hora),
        'Confirmar',
        'Cancelar'
      );
      return;
    }

    // Verificar si el día está bloqueado (modo normal)
    if (isDayBlocked(fecha)) {
      showError('Día bloqueado', 'No se pueden agendar citas en días bloqueados');
      return;
    }

    const citasEnHora = getCitasForDateAndTime(fecha, hora);
    
    if (citasEnHora.length > 0) {
      // Si hay una cita, abrir para editar
      openBookingModal(null, citasEnHora[0]);
    } else {
      // Si no hay cita, abrir para crear nueva
      const horaFin = HORAS_DIA[HORAS_DIA.indexOf(hora) + 1] || '18:30';
      openBookingModal({
        fecha: fecha.getFullYear() + '-' + 
          String(fecha.getMonth() + 1).padStart(2, '0') + '-' + 
          String(fecha.getDate()).padStart(2, '0'),
        hora_inicio: hora,
        hora_fin: horaFin
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dental-teal mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-dental-teal text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  <Image
                    src="/images/dental-logo.png"
                    alt="Clínica Dental Logo"
                    width={48}
                    height={48}
                    priority
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Gestión de Citas</h1>
                  <p className="text-xs md:text-sm text-dental-teal-100">DRA. LAURA CAMPOS - UCR</p>
                </div>
              </div>
              <Link href="/" className="btn !bg-emerald-700 text-white hover:!bg-emerald-800 w-full sm:w-auto text-center font-semibold shadow-md transition-all">
                Volver al Inicio
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-3 md:p-6">
          {/* Reschedule Mode Banner */}
          {reschedulingAppointment && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 rounded-r-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ArrowsRightLeftIcon className="w-5 h-5 text-yellow-700 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Reagendando cita de: <span className="font-bold">{reschedulingAppointment.paciente}</span>
                    </p>
                    <p className="text-xs text-yellow-700">
                      Haga clic en cualquier horario disponible para mover la cita
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelReschedule}
                  className="text-yellow-700 hover:text-yellow-900 font-medium text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Calendar Controls */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              {/* View Selector */}
              <div className="flex space-x-2">
                {[
                  { key: 'dia', label: 'Día' },
                  { key: 'semana', label: 'Semana' },
                  { key: 'mes', label: 'Mes' }
                ].map(vista => (
                  <button
                    key={vista.key}
                    onClick={() => setVistaCalendario(vista.key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      vistaCalendario === vista.key
                        ? 'bg-dental-teal text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {vista.label}
                  </button>
                ))}
              </div>

              {/* Date Navigation */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {vistaCalendario === 'mes' && 
                      fechaSeleccionada.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                    }
                    {vistaCalendario === 'semana' && 
                      `${getWeekDates(fechaSeleccionada)[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${getWeekDates(fechaSeleccionada)[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    }
                    {vistaCalendario === 'dia' && 
                      formatDate(fechaSeleccionada.getFullYear() + '-' + 
                        String(fechaSeleccionada.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(fechaSeleccionada.getDate()).padStart(2, '0'))
                    }
                  </h2>
                </div>

                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setFechaSeleccionada(new Date())}
                className="btn btn-secondary flex items-center justify-center"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Hoy
              </button>
            </div>
          </div>

          {/* Calendar View */}
          {vistaCalendario === 'dia' && (
            <DayView 
              fecha={fechaSeleccionada}
              citas={citas}
              onTimeSlotClick={handleTimeSlotClick}
              onEditAppointment={openBookingModal}
              onCancelAppointment={handleCancelAppointment}
              onRescheduleAppointment={handleRescheduleAppointment}
              isDayBlocked={isDayBlocked}
              reschedulingAppointment={reschedulingAppointment}
            />
          )}
          
          {vistaCalendario === 'semana' && (
            <WeekView 
              fechaSeleccionada={fechaSeleccionada}
              citas={citas}
              onTimeSlotClick={handleTimeSlotClick}
              onEditAppointment={openBookingModal}
              onCancelAppointment={handleCancelAppointment}
              onRescheduleAppointment={handleRescheduleAppointment}
              isDayBlocked={isDayBlocked}
              toggleDayBlock={toggleDayBlock}
              reschedulingAppointment={reschedulingAppointment}
            />
          )}
          
          {vistaCalendario === 'mes' && (
            <MonthView 
              fechaSeleccionada={fechaSeleccionada}
              citas={citas}
              onDateClick={(date) => {
                setFechaSeleccionada(date);
                setVistaCalendario('dia');
              }}
              isDayBlocked={isDayBlocked}
            />
          )}

        </main>

        {/* Appointment Booking Modal */}
        <AppointmentModal
          isOpen={showBookingModal}
          onClose={closeBookingModal}
          selectedTimeSlot={selectedTimeSlot}
          selectedPatient={selectedPatient}
          searchQuery={searchQuery}
          searchResults={searchResults}
          searchLoading={searchLoading}
          showNewPatientForm={showNewPatientForm}
          newPatientData={newPatientData}
          editingAppointment={editingAppointment}
          onSearchChange={handleSearchChange}
          onPatientSelect={handlePatientSelect}
          onShowNewPatientForm={() => setShowNewPatientForm(true)}
          onNewPatientDataChange={setNewPatientData}
          onNewPatientSubmit={handleNewPatientSubmit}
          onBookAppointment={handleBookAppointment}
        />

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
    </ProtectedRoute>
  );
}

// Day View Component
function DayView({ fecha, citas, onTimeSlotClick, onEditAppointment, onCancelAppointment, onRescheduleAppointment, isDayBlocked, reschedulingAppointment }) {
  const fechaStr = fecha.getFullYear() + '-' + 
    String(fecha.getMonth() + 1).padStart(2, '0') + '-' + 
    String(fecha.getDate()).padStart(2, '0');
  const citasDelDia = citas.filter(cita => cita.fecha === fechaStr && cita.estado !== 'cancelada');
  const isBlocked = isDayBlocked(fecha);

  const formatTime = (timeStr) => {
    const time24 = timeStr.substring(0, 5);
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className={`p-4 border-b ${isBlocked ? 'bg-red-50' : ''}`}>
        <h3 className={`text-lg font-semibold ${isBlocked ? 'text-red-700' : 'text-gray-800'}`}>
          {formatDate(fechaStr)}
          {isBlocked && <span className="ml-2 text-sm font-medium text-red-600">- DÍA BLOQUEADO</span>}
        </h3>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {HORAS_DIA.map(hora => {
            const citasEnHora = citasDelDia.filter(cita => 
              cita.hora_inicio <= hora && cita.hora_fin > hora
            );
            
            return (
              <div 
                key={hora}
                className={`flex items-center border-l-4 transition-colors ${
                  isBlocked 
                    ? 'border-red-200 bg-red-50 cursor-not-allowed' 
                    : reschedulingAppointment && citasEnHora.length === 0
                    ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400 hover:bg-yellow-100 cursor-pointer'
                    : 'border-gray-200 hover:border-dental-teal hover:bg-gray-50 cursor-pointer'
                }`}
                onClick={() => !isBlocked && onTimeSlotClick(fecha, hora)}
              >
                <div className={`w-20 text-sm font-medium pl-3 flex-shrink-0 ${
                  isBlocked ? 'text-red-400' : 'text-gray-600'
                }`}>
                  {formatTime(hora)}
                </div>
                <div className="flex-1 min-h-[48px] flex items-center px-3">
                  {isBlocked ? (
                    <span className="text-red-500 text-sm font-medium">Día bloqueado</span>
                  ) : (
                    <>
                      {citasEnHora.map(cita => (
                        <div 
                          key={cita.id}
                          className={`bg-dental-teal text-white rounded-md px-3 py-1 mr-2 text-sm flex items-center space-x-2 ${
                            reschedulingAppointment?.id === cita.id ? 'ring-2 ring-yellow-400 bg-yellow-600' : ''
                          }`}
                        >
                          <span>{cita.paciente}</span>
                          <span className="text-xs">({cita.hora_inicio} - {cita.hora_fin})</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAppointment(null, cita);
                            }}
                            className="text-white/80 hover:text-white"
                            title="Editar cita"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRescheduleAppointment(cita);
                            }}
                            className="text-white/80 hover:text-white"
                            title="Reagendar cita"
                          >
                            <ArrowsRightLeftIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancelAppointment(cita);
                            }}
                            className="text-white/80 hover:text-white"
                            title="Cancelar cita"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {citasEnHora.length === 0 && (
                        <span className={`text-sm ${
                          reschedulingAppointment ? 'text-yellow-600 font-medium' : 'text-gray-400'
                        }`}>
                          {reschedulingAppointment ? 'Click para reagendar aquí' : 'Click para agendar cita'}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Week View Component  
function WeekView({ fechaSeleccionada, citas, onTimeSlotClick, onEditAppointment, onCancelAppointment, onRescheduleAppointment, isDayBlocked, toggleDayBlock, reschedulingAppointment }) {
  const weekDates = getWeekDates(fechaSeleccionada);
  
  const formatTime = (timeStr) => {
    const time24 = timeStr.substring(0, 5);
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with days */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 text-sm font-medium text-gray-600"></div>
          {weekDates.map(date => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isBlocked = isDayBlocked(date);
            return (
              <div 
                key={date.toISOString()} 
                className={`p-3 text-center border-l cursor-pointer hover:bg-opacity-20 transition-colors ${
                  isBlocked ? 'bg-red-100 ring-2 ring-red-500 ring-inset' : 
                  isToday ? 'bg-dental-teal bg-opacity-10 ring-2 ring-dental-teal ring-inset' : 
                  'hover:bg-gray-100'
                }`}
                onClick={() => toggleDayBlock(date)}
                title={isBlocked ? 'Día bloqueado - Click para desbloquear' : 'Click para bloquear día'}
              >
                <div className={`text-sm font-medium ${
                  isBlocked ? 'text-red-700' :
                  isToday ? 'text-dental-dark-teal' : 'text-gray-800'
                }`}>
                  {date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                </div>
                <div className={`text-lg font-semibold mt-1 ${
                  isBlocked ? 'text-red-700' :
                  isToday ? 'text-dental-dark-teal' : 'text-gray-800'
                }`}>
                  {date.getDate()}
                </div>
                {isBlocked && (
                  <div className="text-xs text-red-600 mt-1 font-medium">BLOQUEADO</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        <div>
          {HORAS_DIA.map(hora => (
            <div key={hora} className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-2 text-xs text-gray-600 font-medium text-right pr-3 border-r">
                {formatTime(hora)}
              </div>
              {weekDates.map(date => {
                const fechaStr = date.getFullYear() + '-' + 
                  String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(date.getDate()).padStart(2, '0');
                const citasEnHora = citas.filter(cita => 
                  cita.fecha === fechaStr && 
                  cita.hora_inicio <= hora && 
                  cita.hora_fin > hora &&
                  cita.estado !== 'cancelada'
                );
                const isToday = date.toDateString() === new Date().toDateString();
                const isBlocked = isDayBlocked(date);

                return (
                  <div 
                    key={date.toISOString()}
                    className={`min-h-[40px] p-1 border-l ${
                      isBlocked ? 'bg-red-50 cursor-not-allowed' :
                      reschedulingAppointment && citasEnHora.length === 0 ? 'bg-yellow-50 hover:bg-yellow-100 cursor-pointer' :
                      'hover:bg-gray-50 cursor-pointer'
                    } ${isToday && !isBlocked && !reschedulingAppointment ? 'bg-dental-teal bg-opacity-5' : ''}`}
                    onClick={() => !isBlocked && onTimeSlotClick(date, hora)}
                  >
                    {isBlocked ? (
                      <div className="text-xs text-red-500 font-medium text-center py-2">
                        DÍA BLOQUEADO
                      </div>
                    ) : (
                      citasEnHora.map(cita => (
                        <div 
                          key={cita.id}
                          className={`bg-dental-teal text-white rounded px-1 py-0.5 text-xs flex items-center justify-between ${
                            reschedulingAppointment?.id === cita.id ? 'ring-1 ring-yellow-400 bg-yellow-600' : ''
                          }`}
                        >
                          <span className="truncate">{cita.paciente}</span>
                          <div className="flex space-x-1 ml-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditAppointment(null, cita);
                              }}
                              className="text-white/80 hover:text-white"
                              title="Editar cita"
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRescheduleAppointment(cita);
                              }}
                              className="text-white/80 hover:text-white"
                              title="Reagendar cita"
                            >
                              <ArrowsRightLeftIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelAppointment(cita);
                              }}
                              className="text-white/80 hover:text-white"
                              title="Cancelar cita"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Month View Component
function MonthView({ fechaSeleccionada, citas, onDateClick, isDayBlocked }) {
  const year = fechaSeleccionada.getFullYear();
  const month = fechaSeleccionada.getMonth();
  
  // Get first day of month and calculate calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const calendarDays = [];
  const current = new Date(startDate);
  
  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  const getCitasForDate = (date) => {
    const fechaStr = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    return citas.filter(cita => cita.fecha === fechaStr && cita.estado !== 'cancelada');
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(date => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === new Date().toDateString();
            const isBlocked = isDayBlocked(date);
            const citasDelDia = getCitasForDate(date);
            
            return (
              <div 
                key={date.toISOString()}
                className={`min-h-[100px] p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                } ${
                  isBlocked ? 'ring-2 ring-red-500 bg-red-50' :
                  isToday ? 'ring-2 ring-dental-teal' : ''
                }`}
                onClick={() => onDateClick(date)}
              >
                <div className={`text-sm font-medium mb-1 ${isBlocked ? 'text-red-700' : ''}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {isBlocked ? (
                    <div className="text-xs text-red-600 font-medium text-center">
                      BLOQUEADO
                    </div>
                  ) : (
                    <>
                      {citasDelDia.slice(0, 3).map(cita => (
                        <div 
                          key={cita.id}
                          className="text-xs bg-dental-teal text-white rounded px-1 py-0.5 truncate"
                        >
                          {cita.hora_inicio} {cita.paciente}
                        </div>
                      ))}
                      {citasDelDia.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{citasDelDia.length - 3} más
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Appointment Modal Component
function AppointmentModal({
  isOpen,
  onClose,
  selectedTimeSlot,
  selectedPatient,
  searchQuery,
  searchResults,
  searchLoading,
  showNewPatientForm,
  newPatientData,
  editingAppointment,
  onSearchChange,
  onPatientSelect,
  onShowNewPatientForm,
  onNewPatientDataChange,
  onNewPatientSubmit,
  onBookAppointment
}) {
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (editingAppointment) {
      setNotas(editingAppointment.notas || '');
    } else {
      setNotas('');
    }
  }, [editingAppointment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onBookAppointment({ notas });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
              </h3>
              
              {selectedTimeSlot && (
                <div className="bg-blue-50 p-3 rounded-md mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Fecha:</strong> {formatDate(selectedTimeSlot.fecha)}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Horario:</strong> {selectedTimeSlot.hora_inicio} - {selectedTimeSlot.hora_fin}
                  </p>
                </div>
              )}

              {/* Patient Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={onSearchChange}
                    className="form-control pr-10"
                    placeholder="Buscar por cédula o nombre..."
                    disabled={editingAppointment}
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && !editingAppointment && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map(patient => (
                      <div
                        key={patient.id}
                        onClick={() => onPatientSelect(patient)}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{patient.paciente}</div>
                        <div className="text-sm text-gray-600">{patient.cedula}</div>
                      </div>
                    ))}
                  </div>
                )}

                {searchLoading && (
                  <div className="text-sm text-gray-500 mt-1">Buscando...</div>
                )}
              </div>

              {/* New Patient Button */}
              {!selectedPatient && !showNewPatientForm && !editingAppointment && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={onShowNewPatientForm}
                    className="btn btn-primary w-full flex items-center justify-center"
                  >
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Crear Nuevo Paciente
                  </button>
                </div>
              )}

              {/* New Patient Form */}
              {showNewPatientForm && !editingAppointment && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Nuevo Paciente</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cédula *
                      </label>
                      <input
                        type="text"
                        value={newPatientData.cedula}
                        onChange={(e) => onNewPatientDataChange(prev => ({ ...prev, cedula: e.target.value }))}
                        className="form-control"
                        placeholder="Número de cédula"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={newPatientData.paciente}
                        onChange={(e) => onNewPatientDataChange(prev => ({ ...prev, paciente: e.target.value }))}
                        className="form-control"
                        placeholder="Nombre del paciente"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onNewPatientSubmit}
                    className="btn btn-primary w-full mt-3 flex items-center justify-center"
                  >
                    Crear Expediente
                  </button>
                </div>
              )}

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="form-control"
                  rows="3"
                  placeholder="Notas adicionales sobre la cita..."
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                disabled={!selectedPatient || !selectedTimeSlot}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {editingAppointment ? 'Actualizar Cita' : 'Programar Cita'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getWeekDates(date) {
  const startOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
    weekDates.push(currentDay);
  }
  return weekDates;
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}