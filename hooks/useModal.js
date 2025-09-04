import { useState } from 'react';

export default function useModal() {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    onConfirm: null
  });

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const showInfo = (title, message, confirmText = 'Aceptar') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'info',
      confirmText,
      cancelText: 'Cancelar',
      onConfirm: null
    });
  };

  const showSuccess = (title, message, confirmText = 'Aceptar') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'success',
      confirmText,
      cancelText: 'Cancelar',
      onConfirm: null
    });
  };

  const showWarning = (title, message, confirmText = 'Aceptar') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'warning',
      confirmText,
      cancelText: 'Cancelar',
      onConfirm: null
    });
  };

  const showError = (title, message, confirmText = 'Aceptar') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'error',
      confirmText,
      cancelText: 'Cancelar',
      onConfirm: null
    });
  };

  const showConfirm = (title, message, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar') => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText,
      onConfirm
    });
  };

  return {
    modal,
    closeModal,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showConfirm
  };
}