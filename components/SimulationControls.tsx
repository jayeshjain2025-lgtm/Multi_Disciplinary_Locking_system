
import React from 'react';
import { LockPhase } from '../types';
import { Wifi, Fingerprint, ScanFace, AlertOctagon } from 'lucide-react';

interface SimulationControlsProps {
  currentPhase: LockPhase;
  verifiedPhases: LockPhase[];
  isFaultMode: boolean;
  onTrigger: (phase: LockPhase) => void;
  onToggleFault: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({ 
  verifiedPhases, 
  isFaultMode, 
  onTrigger, 
  onToggleFault 
}) => {
  const isPhaseVerified = (phase: LockPhase) => verifiedPhases.includes(phase);

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

      <div className="flex flex-wrap gap-4 justify-center bg-black/40 p-4 rounded-2xl border border-white/5">
        <button
          onClick={() => onTrigger(LockPhase.PROXIMITY)}
          className={`flex-1 min-w-[150px] group relative p-4 border rounded-xl transition-all overflow-hidden ${
            isPhaseVerified(LockPhase.PROXIMITY) 
            ? 'bg-cyan-900/30 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
            : 'bg-slate-900 border-slate-800 hover:bg-cyan-900/10 hover:border-cyan-500/30'
          }`}
        >
          <div className="flex flex-col items-center gap-2 relative z-10">
            <Wifi className={`w-6 h-6 transition-colors ${isPhaseVerified(LockPhase.PROXIMITY) ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'}`} />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Phase 01</div>
            <div className="text-sm font-semibold">{isPhaseVerified(LockPhase.PROXIMITY) ? 'Verified' : 'Proximity'}</div>
          </div>
        </button>

        <button
          onClick={() => onTrigger(LockPhase.FINGERPRINT)}
          className={`flex-1 min-w-[150px] group relative p-4 border rounded-xl transition-all overflow-hidden ${
            isPhaseVerified(LockPhase.FINGERPRINT) 
            ? 'bg-green-900/30 border-green-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
            : 'bg-slate-900 border-slate-800 hover:bg-green-900/10 hover:border-green-500/30'
          }`}
        >
          <div className="flex flex-col items-center gap-2 relative z-10">
            <Fingerprint className={`w-6 h-6 transition-colors ${isPhaseVerified(LockPhase.FINGERPRINT) ? 'text-green-400' : 'text-slate-400 group-hover:text-green-400'}`} />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Phase 02</div>
            <div className="text-sm font-semibold">{isPhaseVerified(LockPhase.FINGERPRINT) ? 'Verified' : 'Fingerprint'}</div>
          </div>
        </button>

        <button
          onClick={() => onTrigger(LockPhase.VEIN)}
          className={`flex-1 min-w-[150px] group relative p-4 border rounded-xl transition-all overflow-hidden ${
            isPhaseVerified(LockPhase.VEIN) 
            ? 'bg-purple-900/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
            : 'bg-slate-900 border-slate-800 hover:bg-purple-900/10 hover:border-purple-500/30'
          }`}
        >
          <div className="flex flex-col items-center gap-2 relative z-10">
            <ScanFace className={`w-6 h-6 transition-colors ${isPhaseVerified(LockPhase.VEIN) ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400'}`} />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Phase 03</div>
            <div className="text-sm font-semibold">{isPhaseVerified(LockPhase.VEIN) ? 'Verified' : 'Vein Map'}</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SimulationControls;
