import { useState, useEffect } from 'react';
import { Lock, Delete } from 'lucide-react';

interface LockScreenProps {
  pin: string;
  onUnlock: () => void;
}

export default function LockScreen({ pin, onUnlock }: LockScreenProps) {
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleNumber = (num: string) => {
    if (entered.length < pin.length) {
      const newEntered = entered + num;
      setEntered(newEntered);
      
      if (newEntered.length === pin.length) {
        if (newEntered === pin) {
          setTimeout(() => onUnlock(), 200);
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => {
            setEntered('');
            setError(false);
            setShake(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setEntered(entered.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50 flex items-center justify-center p-4">
      <div className={`max-w-sm w-full ${shake ? 'animate-shake' : ''}`}>
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {/* Lock Icon */}
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            error ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <Lock size={32} className={error ? 'text-red-500' : 'text-amber-500'} />
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">ROMO Locked</h2>
          <p className="text-gray-500 text-sm mb-6">Enter your PIN to unlock</p>

          {/* PIN Dots */}
          <div className="flex justify-center gap-3 mb-8">
            {Array.from({ length: pin.length }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  i < entered.length
                    ? error
                      ? 'bg-red-500 border-red-500'
                      : 'bg-amber-500 border-amber-500'
                    : 'border-gray-300'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">Incorrect PIN. Try again.</p>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumber(num.toString())}
                className="w-16 h-16 rounded-full bg-gray-50 hover:bg-amber-50 text-xl font-medium text-gray-800 transition active:scale-95"
              >
                {num}
              </button>
            ))}
            <div /> {/* Empty space */}
            <button
              onClick={() => handleNumber('0')}
              className="w-16 h-16 rounded-full bg-gray-50 hover:bg-amber-50 text-xl font-medium text-gray-800 transition active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="w-16 h-16 rounded-full bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-500 transition active:scale-95 flex items-center justify-center"
            >
              <Delete size={20} />
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-4">
          🔒 Secured with PIN
        </p>
      </div>
    </div>
  );
}
