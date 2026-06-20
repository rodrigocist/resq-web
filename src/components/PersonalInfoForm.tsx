"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error';
  message: string;
}

export default function PersonalInfoForm() {
  const { user, profile } = useAuth();
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [alert, setAlert] = useState<AlertProps | null>(null);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!user || !profile) {
    return <div className="text-center text-gray-500">Cargando información del usuario...</div>;
  }

  // Show alert temporarily
  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // Handle display name update
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      showAlert('error', 'El nombre no puede estar vacío.');
      return;
    }

    if (displayName === profile.displayName) {
      showAlert('error', 'El nombre es igual al actual.');
      return;
    }

    setIsSubmittingName(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      showAlert('success', 'Nombre actualizado exitosamente.');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Error updating name:', err);
      showAlert('error', `Error al actualizar: ${error.message || 'Intenta de nuevo.'}`);
      setDisplayName(profile.displayName);
    } finally {
      setIsSubmittingName(false);
    }
  };

  // Handle password change
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!currentPassword) {
      showAlert('error', 'Por favor, ingresa tu contraseña actual.');
      return;
    }

    if (!newPassword) {
      showAlert('error', 'Por favor, ingresa una nueva contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('error', 'Las contraseñas no coinciden.');
      return;
    }

    if (newPassword === currentPassword) {
      showAlert('error', 'La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      // Reauthenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      
      showAlert('success', 'Contraseña actualizada exitosamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Error updating password:', err);

      if (error.code === 'auth/wrong-password') {
        showAlert('error', 'La contraseña actual es incorrecta.');
      } else if (error.code === 'auth/requires-recent-login') {
        showAlert('error', 'Por razones de seguridad, debes iniciar sesión nuevamente para cambiar la contraseña. Cierra sesión y vuelve a iniciar.');
      } else if (error.code === 'auth/weak-password') {
        showAlert('error', 'La contraseña es demasiado débil. Usa al menos 6 caracteres.');
      } else {
        showAlert('error', `Error: ${error.message || 'Intenta de nuevo.'}`);
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Alert */}
      {alert && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${alert.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {alert.type === 'success' ? (
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {alert.message}
          </p>
        </div>
      )}

      {/* Email (Read-only) */}
      <section className="space-y-4 pb-6 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Correo Electrónico</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user.email || ''}
            disabled
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Tu correo electrónico no puede ser modificado desde aquí.
          </p>
        </div>
      </section>

      {/* Display Name */}
      <section className="space-y-4 pb-6 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Nombre Completo</h3>
        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-colors"
              disabled={isSubmittingName}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingName || displayName.trim() === profile.displayName}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isSubmittingName || displayName.trim() === profile.displayName
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
            }`}
          >
            {isSubmittingName ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </form>
      </section>

      {/* Password Change */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Contraseña</h3>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            {showPasswordForm ? 'Cancelar' : 'Cambiar Contraseña'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handleUpdatePassword} className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-colors pr-10"
                  disabled={isSubmittingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-colors pr-10"
                  disabled={isSubmittingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-colors pr-10"
                  disabled={isSubmittingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingPassword}
              className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isSubmittingPassword
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
              }`}
            >
              {isSubmittingPassword ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Actualizando...
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>
          </form>
        )}
      </section>

      {/* Info Note */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Nota de Seguridad:</strong> Por razones de seguridad, algunos cambios pueden requerir que inicies sesión nuevamente. Si se te solicita, simplemente cierra sesión y vuelve a iniciar con tu nueva información.
        </p>
      </div>
    </div>
  );
}

