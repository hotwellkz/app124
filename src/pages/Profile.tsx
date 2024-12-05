import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, updateUserPassword, deleteUserAccount } from '../lib/firebase/auth';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';
import { PasswordPrompt } from '../components/PasswordPrompt';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateUserProfile(displayName);
      showSuccessNotification('Профиль успешно обновлен');
    } catch (error) {
      showErrorNotification('Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showErrorNotification('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      showSuccessNotification('Пароль успешно изменен');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      showErrorNotification('Ошибка при изменении пароля');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (isAuthenticated: boolean) => {
    if (!isAuthenticated) {
      setShowDeleteConfirm(false);
      return;
    }

    try {
      await deleteUserAccount(currentPassword);
      showSuccessNotification('Аккаунт успешно удален');
      navigate('/login');
    } catch (error) {
      showErrorNotification('Ошибка при удалении аккаунта');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center py-4">
            <button onClick={() => navigate(-1)} className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Профиль</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Обновление профиля */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Основная информация</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>

          {/* Изменение пароля */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Изменение пароля</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  {loading ? 'Изменение...' : 'Изменить пароль'}
                </button>
              </div>
            </form>
          </div>

          {/* Удаление аккаунта */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-red-600 mb-4">Опасная зона</h2>
            <p className="text-sm text-gray-500 mb-4">
              После удаления аккаунта все данные будут безвозвратно утеряны. Это действие нельзя отменить.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Удалить аккаунт
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <PasswordPrompt
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onSuccess={() => handleDeleteAccount(true)}
          title="Подтверждение удаления"
          message="Для удаления аккаунта введите пароль"
        />
      )}
    </div>
  );
};