import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PencilIcon, TrashIcon, Bars3Icon, UserIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '../../components/ProtectedRoute';
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

// Sortable treatment row component
function SortableTreatmentRow({ treatment, editTreatment, deleteTreatment, toggleTreatmentStatus }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: treatment.id });

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
          <span className="text-sm font-medium">{treatment.display_order}</span>
        </div>
      </td>
      <td className="p-3">
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
          {treatment.category}
        </span>
      </td>
      <td className="p-3 font-medium">{treatment.treatment_name}</td>
      <td className="p-3">
        <button
          onClick={() => toggleTreatmentStatus(treatment.id, treatment.is_active)}
          className={`px-2 py-1 rounded text-xs font-medium ${
            treatment.is_active 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          {treatment.is_active ? 'Activo' : 'Inactivo'}
        </button>
      </td>
      <td className="p-3 text-center">
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => editTreatment(treatment)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            title="Editar"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteTreatment(treatment.id)}
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [treatmentsLoading, setTreatmentsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('users');
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
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'user',
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
    fetchTreatmentOptions();
    fetchUsers();
  }, []);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCategorySuggestions(false);
    };

    if (showCategorySuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCategorySuggestions]);

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

  const fetchTreatmentOptions = async () => {
    try {
      const response = await fetch('/api/admin/treatment-options');
      if (response.ok) {
        const data = await response.json();
        setTreatmentOptions(data.treatments);
      } else {
        showError('Error', 'No se pudieron cargar las opciones de tratamiento');
      }
    } catch (error) {
      console.error('Error fetching treatment options:', error);
      showError('Error de conexión', 'Error al cargar los tratamientos');
    } finally {
      setTreatmentsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/auth/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        showError('Error', 'No se pudieron cargar los usuarios');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Error de conexión', 'Error al cargar los usuarios');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = '/api/admin/medical-history-fields';
      const method = editingField ? 'PUT' : 'POST';
      
      let body;
      if (editingField) {
        // For updates, include the ID and all form data with trimmed strings
        body = { 
          ...formData, 
          id: editingField.id,
          field_label: formData.field_label.trim()
        };
      } else {
        // For creates, set display_order to 1 (first position) and shift others
        body = {
          field_label: formData.field_label.trim(),
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

  const handleTreatmentSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = '/api/admin/treatment-options';
      const method = editingTreatment ? 'PUT' : 'POST';
      
      let body;
      if (editingTreatment) {
        body = { 
          ...treatmentFormData, 
          id: editingTreatment.id,
          category: treatmentFormData.category.trim(),
          treatment_name: treatmentFormData.treatment_name.trim()
        };
      } else {
        body = {
          category: treatmentFormData.category.trim(),
          treatment_name: treatmentFormData.treatment_name.trim(),
          is_active: treatmentFormData.is_active,
          display_order: 1
        };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        showSuccess(
          editingTreatment ? 'Tratamiento actualizado' : 'Tratamiento creado',
          editingTreatment ? 'El tratamiento se actualizó correctamente' : 'El tratamiento se creó correctamente'
        );
        fetchTreatmentOptions();
        resetTreatmentForm();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Error al guardar el tratamiento');
      }
    } catch (error) {
      console.error('Error saving treatment:', error);
      showError('Error de conexión', 'Error al guardar el tratamiento');
    }
  };

  const deleteTreatment = async (treatmentId) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este tratamiento?\n\nEsto afectará todos los expedientes existentes.',
      async () => {
        try {
          const response = await fetch(`/api/admin/treatment-options?id=${treatmentId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            showSuccess('Tratamiento eliminado', 'El tratamiento se eliminó correctamente');
            fetchTreatmentOptions();
          } else {
            showError('Error', 'No se pudo eliminar el tratamiento');
          }
        } catch (error) {
          console.error('Error deleting treatment:', error);
          showError('Error de conexión', 'Error al eliminar el tratamiento');
        }
      }
    );
  };

  const editTreatment = (treatment) => {
    setEditingTreatment(treatment);
    setTreatmentFormData({
      category: treatment.category,
      treatment_name: treatment.treatment_name,
      is_active: Boolean(treatment.is_active),
      display_order: treatment.display_order
    });
  };

  const resetTreatmentForm = () => {
    setEditingTreatment(null);
    setTreatmentFormData({
      category: '',
      treatment_name: '',
      is_active: true
    });
    setShowCategorySuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = '/api/auth/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      let body;
      if (editingUser) {
        body = { 
          ...userFormData, 
          id: editingUser.id,
          username: userFormData.username.trim(),
          full_name: userFormData.full_name.trim()
        };
        // Solo incluir password si se proporcionó uno nuevo
        if (!userFormData.password) {
          delete body.password;
        }
      } else {
        if (!userFormData.password) {
          showError('Error', 'La contraseña es obligatoria para nuevos usuarios');
          return;
        }
        body = {
          username: userFormData.username.trim(),
          password: userFormData.password,
          full_name: userFormData.full_name.trim(),
          role: userFormData.role,
          is_active: userFormData.is_active
        };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        showSuccess(
          editingUser ? 'Usuario actualizado' : 'Usuario creado',
          editingUser ? 'El usuario se actualizó correctamente' : 'El usuario se creó correctamente'
        );
        fetchUsers();
        resetUserForm();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'Error al guardar el usuario');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showError('Error de conexión', 'Error al guardar el usuario');
    }
  };

  const deleteUser = async (userId) => {
    showConfirm(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este usuario?\n\nEsta acción no se puede deshacer.',
      async () => {
        try {
          const response = await fetch(`/api/auth/users?id=${userId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            showSuccess('Usuario eliminado', 'El usuario se eliminó correctamente');
            fetchUsers();
          } else {
            const errorData = await response.json();
            showError('Error', errorData.error || 'No se pudo eliminar el usuario');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          showError('Error de conexión', 'Error al eliminar el usuario');
        }
      }
    );
  };

  const editUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      password: '', // Dejar vacío para no cambiar la contraseña
      full_name: user.full_name,
      role: user.role,
      is_active: Boolean(user.is_active)
    });
  };

  const resetUserForm = () => {
    setEditingUser(null);
    setUserFormData({
      username: '',
      password: '',
      full_name: '',
      role: 'user',
      is_active: true
    });
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, is_active: !currentStatus })
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || 'No se pudo actualizar el usuario');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Obtener categorías únicas existentes
  const getUniqueCategories = () => {
    if (!treatmentOptions || treatmentOptions.length === 0) return [];
    const categories = treatmentOptions.map(option => option.category);
    return [...new Set(categories)].sort();
  };

  // Filtrar categorías que coincidan con el texto actual
  const getFilteredCategories = () => {
    const currentCategory = treatmentFormData.category.toLowerCase();
    if (!currentCategory) return getUniqueCategories();
    
    const uniqueCategories = getUniqueCategories();
    if (!uniqueCategories || uniqueCategories.length === 0) return [];
    
    return uniqueCategories.filter(category => 
      category.toLowerCase().includes(currentCategory) && 
      category.toLowerCase() !== currentCategory
    );
  };

  // Manejar selección de categoría
  const handleCategorySelect = (selectedCategory) => {
    setTreatmentFormData(prev => ({ ...prev, category: selectedCategory }));
    setShowCategorySuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Manejar cambio en input de categoría
  const handleCategoryInputChange = (e) => {
    const value = e.target.value;
    setTreatmentFormData(prev => ({ ...prev, category: value }));
    setShowCategorySuggestions(true);
    setSelectedSuggestionIndex(-1);
  };

  // Manejar teclas en el input de categoría
  const handleCategoryKeyDown = (e) => {
    const filteredCategories = getFilteredCategories();
    const allCategories = treatmentFormData.category ? filteredCategories : getUniqueCategories();
    
    if (!showCategorySuggestions || allCategories.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < allCategories.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : allCategories.length - 1
        );
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          handleCategorySelect(allCategories[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowCategorySuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
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

  const handleTreatmentDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = treatmentOptions.findIndex((treatment) => treatment.id === active.id);
      const newIndex = treatmentOptions.findIndex((treatment) => treatment.id === over.id);

      const newTreatmentOptions = arrayMove(treatmentOptions, oldIndex, newIndex);
      
      setTreatmentOptions(newTreatmentOptions);

      try {
        const updatePromises = newTreatmentOptions.map((treatment, index) => {
          const newOrder = index + 1;
          if (treatment.display_order !== newOrder) {
            return fetch('/api/admin/treatment-options', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: treatment.id, display_order: newOrder })
            });
          }
          return null;
        }).filter(Boolean);

        await Promise.all(updatePromises);
        
        fetchTreatmentOptions();
      } catch (error) {
        console.error('Error updating treatment order:', error);
        fetchTreatmentOptions();
        showError('Error', 'No se pudo actualizar el orden');
      }
    }
  };

  const toggleTreatmentStatus = async (treatmentId, currentStatus) => {
    try {
      const response = await fetch('/api/admin/treatment-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: treatmentId, is_active: !currentStatus })
      });

      if (response.ok) {
        fetchTreatmentOptions();
      }
    } catch (error) {
      console.error('Error updating treatment status:', error);
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
    <ProtectedRoute adminOnly={true}>
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
        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-dental-teal text-dental-teal'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserIcon className="w-5 h-5 inline mr-2" />
                Gestión de Usuarios
              </button>
              <button
                onClick={() => setActiveTab('medical')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'medical'
                    ? 'border-dental-teal text-dental-teal'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Gestión de Historia Médica
              </button>
              <button
                onClick={() => setActiveTab('treatments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'treatments'
                    ? 'border-dental-teal text-dental-teal'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Gestión de Tratamientos
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Usuarios</h2>
            
              {/* User Form */}
              <form onSubmit={handleUserSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                    Padecimiento activo
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button type="submit" className="btn btn-primary">
                  {editingField ? 'Actualizar' : 'Crear'} Padecimiento
                </button>
                {editingField && (
                  <button type="button" onClick={resetForm} className="btn btn-secondary">
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* Fields List */}
            {medicalFields && medicalFields.length > 0 && (
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
                      items={medicalFields ? medicalFields.map(field => field.id) : []} 
                      strategy={verticalListSortingStrategy}
                    >
                      {medicalFields && medicalFields.map((field) => (
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
              
              {medicalFields && medicalFields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay campos configurados
                </div>
              )}
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Usuarios</h2>
            
            {/* User Form */}
            <form onSubmit={handleUserSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario *
                  </label>
                  <input
                    type="text"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="form-control"
                    placeholder="ej. juan.perez"
                    required
                    disabled={editingUser} // No permitir cambiar username en edición
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="form-control"
                    placeholder={editingUser ? 'Dejar vacío para no cambiar' : 'Contraseña'}
                    required={!editingUser}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={userFormData.full_name}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="form-control"
                    placeholder="ej. Juan Pérez"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Usuario
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="form-control"
                  >
                    <option value="user">Usuario Regular</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={userFormData.is_active}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="mr-2"
                  />
                  Usuario activo
                </label>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button type="submit" className="btn btn-primary">
                  <UserIcon className="w-4 h-4 inline mr-2" />
                  {editingUser ? 'Actualizar' : 'Crear'} Usuario
                </button>
                {editingUser && (
                  <button type="button" onClick={resetUserForm} className="btn btn-secondary">
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* Users List */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-dental-teal text-white">
                    <th className="p-3 text-left">Usuario</th>
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Tipo</th>
                    <th className="p-3 text-left">Estado</th>
                    <th className="p-3 text-left hidden sm:table-cell">Último Acceso</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users && users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{user.username}</td>
                      <td className="p-3">{user.full_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 'Usuario Regular'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="p-3 text-sm text-gray-600 hidden sm:table-cell">
                        {user.last_login ? new Date(user.last_login).toLocaleString('es-ES') : 'Nunca'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => editUser(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          {user.username !== 'laura' && (
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users && users.length === 0 && !usersLoading && (
                <div className="text-center py-8 text-gray-500">
                  No hay usuarios registrados
                </div>
              )}
              {usersLoading && (
                <div className="text-center py-8 text-gray-500">
                  Cargando usuarios...
                </div>
              )}
            </div>
          </div>

          {/* Treatment Options Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Tratamientos</h2>
            
            {/* Treatment Form */}
            <form onSubmit={handleTreatmentSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editingTreatment ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={treatmentFormData.category}
                      onChange={handleCategoryInputChange}
                      onKeyDown={handleCategoryKeyDown}
                      onFocus={() => setShowCategorySuggestions(true)}
                      onClick={(e) => e.stopPropagation()}
                      className="form-control"
                      placeholder="ej. Tipos de resina"
                      required
                      autoComplete="off"
                    />
                    
                    {/* Lista de sugerencias de autocomplete */}
                    {showCategorySuggestions && getFilteredCategories().length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {getFilteredCategories() && getFilteredCategories().map((category, index) => (
                          <div
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategorySelect(category);
                            }}
                            className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              index === selectedSuggestionIndex 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{category}</span>
                              <span className="ml-auto text-xs text-gray-500">
                                {treatmentOptions ? treatmentOptions.filter(t => t.category === category).length : 0} tratamientos
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Mostrar todas las categorías cuando el campo está vacío y tiene foco */}
                    {showCategorySuggestions && !treatmentFormData.category && getUniqueCategories().length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                          Categorías existentes:
                        </div>
                        {getUniqueCategories() && getUniqueCategories().map((category, index) => (
                          <div
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategorySelect(category);
                            }}
                            className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              index === selectedSuggestionIndex 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{category}</span>
                              <span className="ml-auto text-xs text-gray-500">
                                {treatmentOptions ? treatmentOptions.filter(t => t.category === category).length : 0} tratamientos
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Tratamiento *
                  </label>
                  <input
                    type="text"
                    value={treatmentFormData.treatment_name}
                    onChange={(e) => setTreatmentFormData(prev => ({ ...prev, treatment_name: e.target.value }))}
                    className="form-control"
                    placeholder="ej. Resina CI"
                    required
                  />
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={treatmentFormData.is_active}
                      onChange={(e) => setTreatmentFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    Tratamiento activo
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button type="submit" className="btn btn-primary">
                  {editingTreatment ? 'Actualizar' : 'Crear'} Tratamiento
                </button>
                {editingTreatment && (
                  <button type="button" onClick={resetTreatmentForm} className="btn btn-secondary">
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* Treatment Options List */}
            {treatmentOptions && treatmentOptions.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Arrastra el ícono <Bars3Icon className="w-4 h-4 inline mx-1" /> 
                  para reordenar los tratamientos. El orden aquí se refleja en los formularios.
                </p>
              </div>
            )}
            <div className="overflow-x-auto">
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragEnd={handleTreatmentDragEnd}
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-dental-teal text-white">
                      <th className="p-3 text-left">Orden</th>
                      <th className="p-3 text-left">Categoría</th>
                      <th className="p-3 text-left">Tratamiento</th>
                      <th className="p-3 text-left">Estado</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext 
                      items={treatmentOptions ? treatmentOptions.map(treatment => treatment.id) : []} 
                      strategy={verticalListSortingStrategy}
                    >
                      {treatmentOptions && treatmentOptions.map((treatment) => (
                        <SortableTreatmentRow 
                          key={treatment.id}
                          treatment={treatment}
                          editTreatment={editTreatment}
                          deleteTreatment={deleteTreatment}
                          toggleTreatmentStatus={toggleTreatmentStatus}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
              
              {treatmentOptions && treatmentOptions.length === 0 && !treatmentsLoading && (
                <div className="text-center py-8 text-gray-500">
                  No hay tratamientos configurados
                </div>
              )}
              {treatmentsLoading && (
                <div className="text-center py-8 text-gray-500">
                  Cargando tratamientos...
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
    </ProtectedRoute>
  );
}