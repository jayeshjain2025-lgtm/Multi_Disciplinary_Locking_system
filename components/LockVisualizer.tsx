
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
      return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/50 glow-cyan';
    }
    return 'text-slate-600 bg-slate-900/50 border-slate-800';
  };

  return (
    <div className="h-full flex flex-col items-center justify-center relative py-10">
      {/* Central Hub */}
      <div className="relative z-10">
        <div className={`w-48 h-48 rounded-full border-2 flex items-center justify-center transition-all duration-700 transform ${state.isLocked ? 'border-slate-800' : 'border-green-500 glow-green scale-110'}`}>
          <div className={`w-40 h-40 rounded-full border border-white/5 flex items-center justify-center transition-all duration-500 ${state.isLocked ? '' : 'bg-green-500/10'}`}>
             {state.isLocked ? (
               <Lock className="w-20 h-20 text-slate-700" />
             ) : (
               <Unlock className="w-20 h-20 text-green-400 animate-bounce" />
             )}
          </div>
        </div>
        
        {/* Rotating Rings */}
        <div className={`absolute -inset-4 border border-cyan-400/20 rounded-full border-dashed animate-[spin_10s_linear_infinite] ${state.isLocked ? 'opacity-30' : 'opacity-100'}`} />
        <div className={`absolute -inset-8 border border-purple-400/10 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse] ${state.isLocked ? 'opacity-20' : 'opacity-80'}`} />
      </div>

      {/* Phase Trackers */}
      <div className="mt-12 w-full max-w-2xl grid grid-cols-3 gap-4">
        <div className={`flex flex-col items-center p-4 border rounded-2xl transition-all duration-500 ${getPhaseStyles(LockPhase.PROXIMITY)}`}>
          <Key className="w-6 h-6 mb-2" />
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Phase 01</span>
          <span className="text-xs font-bold">PROXIMITY</span>
        </div>
        
        <div className={`flex flex-col items-center p-4 border rounded-2xl transition-all duration-500 ${getPhaseStyles(LockPhase.FINGERPRINT)}`}>
          <Fingerprint className="w-6 h-6 mb-2" />
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Phase 02</span>
          <span className="text-xs font-bold">BIOMETRIC</span>
        </div>

        <div className={`flex flex-col items-center p-4 border rounded-2xl transition-all duration-500 ${getPhaseStyles(LockPhase.VEIN)}`}>
          <ScanEye className="w-6 h-6 mb-2" />
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Phase 03</span>
          <span className="text-xs font-bold">VEIN MAP</span>
        </div>
      </div>

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
};

export default LockVisualizer;
