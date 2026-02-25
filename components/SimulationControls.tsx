
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
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex items-center justify-between px-4 py-3 bg-black/20 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors ${isFaultMode ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">Fault Injection Mode</div>
            <div className="text-[10px] text-slate-500">Enable to simulate hardware/biometric failure</div>
          </div>
        </div>
        <button
          onClick={onToggleFault}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isFaultMode ? 'bg-red-600' : 'bg-slate-700'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isFaultMode ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
          onClick={() => onTrigger(LockPhase.PROXIMITY)}
          disabled={!hasBluetooth}
          className={`group relative p-4 border rounded-xl transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
            isPhaseVerified(LockPhase.PROXIMITY) 
            ? 'bg-blue-900/30 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
            : 'bg-slate-900 border-slate-800 hover:bg-blue-900/10 hover:border-blue-500/30'
          }`}
        >
          <div className="flex flex-col items-center gap-2 relative z-10">
            <Bluetooth className={`w-6 h-6 transition-colors ${isPhaseVerified(LockPhase.PROXIMITY) ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`} />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Phase 01</div>
            <div className="text-sm font-semibold">{isPhaseVerified(LockPhase.PROXIMITY) ? 'BT Verified' : 'Bluetooth'}</div>
          </div>
          {!hasBluetooth && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-center p-2">Register a Bluetooth device</div>}
        </button>

                <button
          onClick={() => onTrigger(LockPhase.FINGERPRINT)}
          disabled={!hasPhone}
          className={`group relative p-4 border rounded-xl transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${
            isPhaseVerified(LockPhase.FINGERPRINT) 
            ? 'bg-green-900/30 border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.2)]' 
            : 'bg-slate-900 border-slate-800 hover:bg-green-900/10 hover:border-green-500/30'
          }`}
        >
          <div className="flex flex-col items-center gap-2 relative z-10">
            <Smartphone className={`w-6 h-6 transition-colors ${isPhaseVerified(LockPhase.FINGERPRINT) ? 'text-green-400' : 'text-slate-400 group-hover:text-green-400'}`} />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Phase 02</div>
            <div className="text-sm font-semibold">{isPhaseVerified(LockPhase.FINGERPRINT) ? 'FP Verified' : 'Phone FP'}</div>
          </div>
           {!hasPhone && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-center p-2">Register a Phone device</div>}
        </button>

                <button
          onClick={() => onTrigger(LockPhase.VEIN)}
          className={`group relative p-4 border rounded-xl transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="flex flex-col items-center gap-2 relative z-10">
            <ScanFace className={`w-6 h-6 transition-colors ${isPhaseVerified(LockPhase.VEIN) ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400'}`} />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Phase 03</div>
            <div className="text-sm font-semibold">{isPhaseVerified(LockPhase.VEIN) ? 'Verified' : 'Vein Map'}</div>
          </div>
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-center p-2">Hardware key required</div>
        </button>
      </div>
    </div>
  );
};

export default SimulationControls;
