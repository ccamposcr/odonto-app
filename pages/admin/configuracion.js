import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusIcon, PencilIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Modal from '../../components/Modal';
import useModal from '../../hooks/useModal';

// Sortable table row component
function SortableTableRow({ field, editField, deleteField, toggleFieldStatus }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b hover:bg-gray-50 ${isDragging ? 'bg-blue-50' : ''}`}
    >
      <td className="p-3">
        <div className="flex items-center space-x-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
            title="Arrastrar para reordenar"
          >
            <Bars3Icon className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm font-medium">{field.display_order}</span>
        </div>
      </td>
      <td className="p-3 font-medium">{field.field_label}</td>
      <td className="p-3">
        <button
          onClick={() => toggleFieldStatus(field.id, field.is_active)}
          className={`px-2 py-1 rounded text-xs font-medium ${
            field.is_active 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          {field.is_active ? 'Activo' : 'Inactivo'}
        </button>
      </td>
      <td className="p-3 text-center">
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => editField(field)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            title="Editar"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteField(field.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Eliminar"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ConfiguracionAdmin() {
  const [medicalFields, setMedicalFields] = useState([]);
  const [treatmentOptions, setTreatmentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [treatmentsLoading, setTreatmentsLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [formData, setFormData] = useState({
    field_key: '',
    field_label: '',
    field_type: 'boolean',
    is_active: true
  });
  const [treatmentFormData, setTreatmentFormData] = useState({
    category: '',
    treatment_name: '',
    is_active: true
  });
  const { modal, closeModal, showConfirm, showSuccess, showError } = useModal();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchMedicalFields();
  }, []);

  const fetchMedicalFields = async () => {
    try {
      const response = await fetch('/api/admin/medical-history-fields');
      if (response.ok) {
        const fields = await response.json();
        setMedicalFields(fields);
      } else {
        showError('Error', 'No se pudieron cargar los campos de historia médica');
      }
    } catch (error) {
      console.error('Error fetching medical fields:', error);
      showError('Error de conexión', 'Error al cargar los campos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = '/api/admin/medical-history-fields';
      const method = editingField ? 'PUT' : 'POST';
      
      let body;
      if (editingField) {
        // For updates, include the ID and all form data
        body = { ...formData, id: editingField.id };
      } else {
        // For creates, set display_order to 1 (first position) and shift others
        const maxOrder = medicalFields.length > 0 ? Math.max(...medicalFields.map(f => f.display_order)) : 0;
        body = {
          field_label: formData.field_label,
          field_type: formData.field_type,
          is_active: formData.is_active,
          display_order: 1 // Always add new fields at the top
        };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        showSuccess(
          editingField ? 'Campo actualizado' : 'Campo creado',
          editingField ? 'El campo se actualizó correctamente' : 'El campo se creó correctamente'
        );
        fetchMedicalFields();
        resetForm();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Error al guardar el campo');
      }
    } catch (error) {
      console.error('Error saving field:', error);
      showError('Error de conexión', 'Error al guardar el campo');
    }
  };

  const deleteField = async (fieldId) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este campo?\n\nEsto afectará todos los expedientes existentes.',
      async () => {
        try {
          const response = await fetch(`/api/admin/medical-history-fields?id=${fieldId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            showSuccess('Campo eliminado', 'El campo se eliminó correctamente');
            fetchMedicalFields();
          } else {
            showError('Error', 'No se pudo eliminar el campo');
          }
        } catch (error) {
          console.error('Error deleting field:', error);
          showError('Error de conexión', 'Error al eliminar el campo');
        }
      }
    );
  };

  const editField = (field) => {
    setEditingField(field);
    setFormData({
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      is_active: Boolean(field.is_active),
      display_order: field.display_order // Keep display_order for editing
    });
  };

  const resetForm = () => {
    setEditingField(null);
    setFormData({
      field_key: '',
      field_label: '',
      field_type: 'boolean',
      is_active: true
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = medicalFields.findIndex((field) => field.id === active.id);
      const newIndex = medicalFields.findIndex((field) => field.id === over.id);

      const newMedicalFields = arrayMove(medicalFields, oldIndex, newIndex);
      
      // Update local state immediately for smooth UX
      setMedicalFields(newMedicalFields);

      // Update display_order for all affected items
      try {
        const updatePromises = newMedicalFields.map((field, index) => {
          const newOrder = index + 1;
          if (field.display_order !== newOrder) {
            return fetch('/api/admin/medical-history-fields', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: field.id, display_order: newOrder })
            });
          }
          return null;
        }).filter(Boolean);

        await Promise.all(updatePromises);
        
        // Refresh from server to ensure consistency
        fetchMedicalFields();
      } catch (error) {
        console.error('Error updating order:', error);
        // Revert on error
        fetchMedicalFields();
        showError('Error', 'No se pudo actualizar el orden');
      }
    }
  };

  const toggleFieldStatus = async (fieldId, currentStatus) => {
    try {
      const response = await fetch('/api/admin/medical-history-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fieldId, is_active: !currentStatus })
      });

      if (response.ok) {
        fetchMedicalFields();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dental-teal mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-dental-teal text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-3 md:px-6 py-4">
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
                <h1 className="text-xl md:text-2xl font-bold">Configuración Admin</h1>
                <p className="text-xs md:text-sm text-dental-teal-100">DRA. LAURA CAMPOS - UCR</p>
              </div>
            </div>
            <Link href="/" className="btn !bg-emerald-700 text-white hover:!bg-emerald-800 w-full sm:w-auto text-center font-semibold shadow-md transition-all">
              Volver al Inicio
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 md:p-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Historia Médica</h2>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editingField ? 'Editar Campo' : 'Nuevo Campo'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiqueta *
                  </label>
                  <input
                    type="text"
                    value={formData.field_label}
                    onChange={(e) => setFormData(prev => ({ ...prev, field_label: e.target.value }))}
                    className="form-control"
                    placeholder="ej. Problemas cardiacos"
                    required
                  />
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    Campo activo
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button type="submit" className="btn btn-primary">
                  {editingField ? 'Actualizar' : 'Crear'} Campo
                </button>
                {editingField && (
                  <button type="button" onClick={resetForm} className="btn btn-secondary">
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* Fields List */}
            {medicalFields.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Arrastra el ícono <Bars3Icon className="w-4 h-4 inline mx-1" /> 
                  para reordenar los campos. El orden aquí se refleja en los formularios.
                </p>
              </div>
            )}
            <div className="overflow-x-auto">
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragEnd={handleDragEnd}
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-dental-teal text-white">
                      <th className="p-3 text-left">Orden</th>
                      <th className="p-3 text-left">Etiqueta</th>
                      <th className="p-3 text-left">Estado</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext 
                      items={medicalFields.map(field => field.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      {medicalFields.map((field) => (
                        <SortableTableRow 
                          key={field.id}
                          field={field}
                          editField={editField}
                          deleteField={deleteField}
                          toggleFieldStatus={toggleFieldStatus}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
              
              {medicalFields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay campos configurados
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

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