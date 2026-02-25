
import React from 'react';
import { LockPhase, LockState } from '../types';
import { Shield, Key, Fingerprint, ScanEye, Lock, Unlock } from 'lucide-react';

interface LockVisualizerProps {
  state: LockState;
}

const LockVisualizer: React.FC<LockVisualizerProps> = ({ state }) => {
  const isVerified = (target: LockPhase) => state.verifiedPhases.includes(target);
  
  const getPhaseStyles = (target: LockPhase) => {
    if (isVerified(target)) {
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
    }
    return 'text-zinc-500 bg-zinc-900/50 border-zinc-800';
  };

  return (
    <div className="h-full flex flex-col items-center justify-center relative py-10">
      {/* Central Hub */}
      <div className="relative z-10">
        <div className={`w-48 h-48 rounded-full border-2 flex items-center justify-center transition-all duration-700 transform ${state.isLocked ? 'border-zinc-800 bg-zinc-950' : 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] scale-110 bg-zinc-900'}`}>
          <div className={`w-40 h-40 rounded-full border border-white/5 flex items-center justify-center transition-all duration-500 ${state.isLocked ? '' : 'bg-emerald-500/10'}`}>
             {state.isLocked ? (
               <Lock className="w-16 h-16 text-zinc-600" strokeWidth={1.5} />
             ) : (
               <Unlock className="w-16 h-16 text-emerald-400 animate-bounce" strokeWidth={1.5} />
             )}
          </div>
        </div>
        
        {/* Rotating Rings */}
        <div className={`absolute -inset-4 border border-zinc-500/20 rounded-full border-dashed animate-[spin_10s_linear_infinite] ${state.isLocked ? 'opacity-30' : 'opacity-100'}`} />
        <div className={`absolute -inset-8 border border-zinc-700/30 rounded-full border-dotted animate-[spin_15s_linear_infinite_reverse] ${state.isLocked ? 'opacity-20' : 'opacity-80'}`} />
      </div>

      {/* Phase Trackers */}
      <div className="mt-12 w-full max-w-2xl grid grid-cols-3 gap-4">
        <div className={`flex flex-col items-center p-4 border rounded-2xl transition-all duration-500 ${getPhaseStyles(LockPhase.PROXIMITY)}`}>
          <Key className="w-6 h-6 mb-2" strokeWidth={1.5} />
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Phase 01</span>
          <span className="text-xs font-semibold mt-0.5">PROXIMITY</span>
        </div>
        
        <div className={`flex flex-col items-center p-4 border rounded-2xl transition-all duration-500 ${getPhaseStyles(LockPhase.FINGERPRINT)}`}>
          <Fingerprint className="w-6 h-6 mb-2" strokeWidth={1.5} />
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Phase 02</span>
          <span className="text-xs font-semibold mt-0.5">BIOMETRIC</span>
        </div>

        <div className={`flex flex-col items-center p-4 border rounded-2xl transition-all duration-500 ${getPhaseStyles(LockPhase.VEIN)}`}>
          <ScanEye className="w-6 h-6 mb-2" strokeWidth={1.5} />
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Phase 03</span>
          <span className="text-xs font-semibold mt-0.5">VEIN MAP</span>
        </div>
      </div>

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-500/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
};

export default LockVisualizer;
