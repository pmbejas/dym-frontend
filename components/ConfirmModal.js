import { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Boton from './Boton';
import Input from './Input';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", type = "danger", requirePassword = false }) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(password);
    setPassword('');
    onClose();
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:w-full sm:max-w-lg w-full">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start gap-4">
              <div className="mx-auto flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:ml-0 sm:mt-0 sm:text-left flex-1">
                <h3 className="text-base font-semibold leading-6 text-slate-900" id="modal-title">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-slate-500 mb-4">
                    {message}
                  </p>
                  {requirePassword && (
                    <div className="mt-2 text-left">
                        {/* Fake input to trick Chrome's password manager */}
                        <input type="text" name="fakeusernameremembered" style={{display: 'none'}} />
                        <input type="password" name="fakepasswordremembered" style={{display: 'none'}} />
                        
                        <Input
                          type="text"
                          name={`validation_${Math.random().toString(36).substring(2, 7)}`}
                          placeholder="Ingrese su contraseña para confirmar"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="off"
                          autoFocus
                          style={{ WebkitTextSecurity: 'disc', fontFamily: 'initial' }}
                          readOnly={password === ''}
                          onFocus={(e) => e.target.removeAttribute('readonly')}
                        />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            <Boton 
              onClick={handleConfirm}
              tipo={type}
              disabled={requirePassword && !password}
            >
              {confirmText}
            </Boton>
            <Boton 
              onClick={handleClose}
              tipo="secondary"
            >
              {cancelText}
            </Boton>
          </div>
        </div>
      </div>
    </div>
  );
}
