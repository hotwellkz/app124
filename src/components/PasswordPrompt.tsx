import React, { useState } from 'react';
import { X } from 'lucide-react';
import { showErrorNotification } from '../utils/notifications';

interface PasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  message?: string;
}

export const PasswordPrompt: React.FC<PasswordPromptProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Введите пароль',
  message = 'Для продолжения введите пароль'
}) => {
  const [password, setPassword] = useState('');
  const CORRECT_PASSWORD = '1888';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setPassword('');
      onSuccess();
    } else {
      showErrorNotification('Неверный пароль');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Введите пароль"
            autoFocus
          />
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Подтвердить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};