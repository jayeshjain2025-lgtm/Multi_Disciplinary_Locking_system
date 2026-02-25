
import React from 'react';
import { RegisteredDevice, LockPhase } from '../types';
import { Wifi, Fingerprint, ScanFace, AlertOctagon, Bluetooth, Smartphone } from 'lucide-react';

interface SimulationControlsProps {
  currentPhase: LockPhase;
  verifiedPhases: LockPhase[];
  isFaultMode: boolean;
  onTrigger: (phase: LockPhase) => void;
  onToggleFault: () => void;
  registeredDevices: RegisteredDevice[];
}

const SimulationControls: React.FC<SimulationControlsProps> = ({ 
  verifiedPhases, 
  isFaultMode, 
  onTrigger, 
  onToggleFault, 
  registeredDevices
}) => {
    const isPhaseVerified = (phase: LockPhase) => verifiedPhases.includes(phase);
  const hasBluetooth = registeredDevices.some(d => d.type === 'BLUETOOTH');
  const hasPhone = registeredDevices.some(d => d.type === 'PHONE');

  return (
    <div className="mt-4 md:mt-6 flex flex-col gap-3 md:gap-4">
      <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 bg-gradient-to-r from-black/30 to-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
        <div className="flex items-center gap-3">
          <div className={`p-2 md:p-2.5 rounded-xl transition-all duration-300 ${
            isFaultMode
              ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 text-red-400 shadow-lg shadow-red-500/20'
              : 'bg-slate-800/50 text-slate-500 group-hover:bg-slate-800'
          }`}>
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs md:text-sm font-bold">Fault Injection Mode</div>
            <div className="text-[10px] md:text-xs text-slate-500 mt-0.5">Simulate hardware/biometric failures</div>
          </div>
        </div>
        <button
          onClick={onToggleFault}
          className={`relative inline-flex h-7 w-12 md:h-8 md:w-14 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner ${
            isFaultMode
              ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/50'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 md:h-6 md:w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
              isFaultMode ? 'translate-x-6 md:translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <button
          onClick={() => onTrigger(LockPhase.PROXIMITY)}
          disabled={!hasBluetooth}
          className={`group relative p-5 md:p-6 border-2 rounded-2xl transition-all duration-300 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed ${
            isPhaseVerified(LockPhase.PROXIMITY)
              ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/50 shadow-lg shadow-blue-500/20'
              : 'bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50 hover:border-blue-400/30 hover:shadow-lg'
          }`}
        >
          {isPhaseVerified(LockPhase.PROXIMITY) && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-cyan-400/5 animate-pulse" />
          )}
          <div className="flex flex-col items-center gap-2.5 relative z-10">
            <div className={`p-3 rounded-xl transition-all duration-300 ${
              isPhaseVerified(LockPhase.PROXIMITY)
                ? 'bg-blue-400/20'
                : 'bg-slate-800/50 group-hover:bg-blue-400/10'
            }`}>
              <Bluetooth className={`w-6 h-6 md:w-7 md:h-7 transition-colors ${
                isPhaseVerified(LockPhase.PROXIMITY) ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'
              }`} />
            </div>
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Phase 01</div>
            <div className="text-sm md:text-base font-bold">{isPhaseVerified(LockPhase.PROXIMITY) ? 'BT Verified' : 'Bluetooth'}</div>
          </div>
          {!hasBluetooth && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center text-xs text-center p-3 font-medium">
              Register a Bluetooth device
            </div>
          )}
        </button>

        <button
          onClick={() => onTrigger(LockPhase.FINGERPRINT)}
          disabled={!hasPhone}
          className={`group relative p-5 md:p-6 border-2 rounded-2xl transition-all duration-300 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed ${
            isPhaseVerified(LockPhase.FINGERPRINT)
              ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/50 shadow-lg shadow-green-500/20'
              : 'bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50 hover:border-green-400/30 hover:shadow-lg'
          }`}
        >
          {isPhaseVerified(LockPhase.FINGERPRINT) && (
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-emerald-400/5 animate-pulse" />
          )}
          <div className="flex flex-col items-center gap-2.5 relative z-10">
            <div className={`p-3 rounded-xl transition-all duration-300 ${
              isPhaseVerified(LockPhase.FINGERPRINT)
                ? 'bg-green-400/20'
                : 'bg-slate-800/50 group-hover:bg-green-400/10'
            }`}>
              <Smartphone className={`w-6 h-6 md:w-7 md:h-7 transition-colors ${
                isPhaseVerified(LockPhase.FINGERPRINT) ? 'text-green-400' : 'text-slate-500 group-hover:text-green-400'
              }`} />
            </div>
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Phase 02</div>
            <div className="text-sm md:text-base font-bold">{isPhaseVerified(LockPhase.FINGERPRINT) ? 'FP Verified' : 'Phone FP'}</div>
          </div>
          {!hasPhone && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center text-xs text-center p-3 font-medium">
              Register a Phone device
            </div>
          )}
        </button>

        <button
          onClick={() => onTrigger(LockPhase.VEIN)}
          className={`group relative p-5 md:p-6 border-2 rounded-2xl transition-all duration-300 overflow-hidden opacity-40 cursor-not-allowed`}
        >
          <div className="flex flex-col items-center gap-2.5 relative z-10">
            <div className="p-3 rounded-xl bg-slate-800/50">
              <ScanFace className="w-6 h-6 md:w-7 md:h-7 text-slate-500" />
            </div>
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Phase 03</div>
            <div className="text-sm md:text-base font-bold">{isPhaseVerified(LockPhase.VEIN) ? 'Verified' : 'Vein Map'}</div>
          </div>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center text-xs text-center p-3 font-medium">
            Hardware key required
          </div>
        </button>
      </div>
    </div>
  );
};

export default SimulationControls;
