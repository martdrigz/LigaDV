import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { AnimatedModal } from './ui/animated-modal';
import { AnimatedButton } from './ui/animated-button';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PinModal({ isOpen, onClose, onSuccess }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const securityPin = import.meta.env.VITE_SECURITY_PIN || 'eldiego';
    if (pin.toLowerCase() === securityPin.toLowerCase()) {
      setError(false);
      setPin('');
      onSuccess();
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-sm"
      title="Acceso Restringido"
      description="Ingresa el PIN de seguridad para continuar"
      icon={<Lock className="text-[#eaba3f]" size={24} />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            placeholder="PIN de seguridad"
            className={`w-full bg-black/50 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl p-4 text-center text-lg font-bold text-white outline-none focus:border-[#eaba3f] focus:ring-1 focus:ring-[#eaba3f] transition-all shadow-inner`}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs font-bold mt-2 text-center absolute w-full left-0">PIN incorrecto</p>}
        </div>
        <AnimatedButton type="submit" variant="primary" size="lg" className="w-full mt-4 text-sm tracking-widest uppercase">
          Confirmar
        </AnimatedButton>
      </form>
    </AnimatedModal>
  );
}
