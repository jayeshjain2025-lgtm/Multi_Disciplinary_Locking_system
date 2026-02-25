
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
    <div className="h-full flex flex-col items-center justify-center relative py-6 md:py-10">
      {/* Central Hub */}
      <div className="relative z-10">
        {!state.isLocked && (
          <div className="absolute inset-0 -m-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        )}

        <div className={`w-40 h-40 md:w-56 md:h-56 rounded-full border-2 flex items-center justify-center transition-all duration-700 transform relative ${
          state.isLocked
            ? 'border-slate-800/50 bg-slate-900/20'
            : 'border-green-400 bg-gradient-to-br from-green-500/10 to-emerald-500/10 glow-green scale-110'
        }`}>
          <div className={`absolute inset-3 rounded-full border transition-all duration-700 ${
            state.isLocked ? 'border-slate-800/30' : 'border-green-400/30'
          }`} />
          <div className={`absolute inset-6 rounded-full border transition-all duration-700 ${
            state.isLocked ? 'border-slate-800/20' : 'border-green-400/20'
          }`} />

          <div className={`w-32 h-32 md:w-44 md:h-44 rounded-full border flex items-center justify-center transition-all duration-500 ${
            state.isLocked
              ? 'border-white/5 bg-slate-900/40'
              : 'border-green-400/50 bg-gradient-to-br from-green-500/20 to-emerald-500/20'
          }`}>
            {state.isLocked ? (
              <div className="relative">
                <div className="absolute inset-0 bg-slate-700/20 blur-xl rounded-full" />
                <Lock className="relative w-16 h-16 md:w-24 md:h-24 text-slate-600" />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-green-400/30 blur-2xl rounded-full animate-pulse" />
                <Unlock className="relative w-16 h-16 md:w-24 md:h-24 text-green-400 animate-bounce" />
              </div>
            )}
          </div>
        </div>

        <div className={`absolute -inset-4 md:-inset-6 border border-cyan-400/20 rounded-full border-dashed animate-[spin_12s_linear_infinite] transition-opacity duration-700 ${
          state.isLocked ? 'opacity-20' : 'opacity-60'
        }`} />
        <div className={`absolute -inset-8 md:-inset-12 border border-blue-400/10 rounded-full border-dashed animate-[spin_18s_linear_infinite_reverse] transition-opacity duration-700 ${
          state.isLocked ? 'opacity-10' : 'opacity-40'
        }`} />
      </div>

      {/* Phase Trackers */}
      <div className="mt-8 md:mt-12 w-full max-w-3xl grid grid-cols-3 gap-3 md:gap-4 px-4">
        <div className={`relative flex flex-col items-center p-3 md:p-5 border-2 rounded-2xl transition-all duration-500 overflow-hidden group ${getPhaseStyles(LockPhase.PROXIMITY)}`}>
          <div className={`absolute inset-0 transition-opacity duration-500 ${isVerified(LockPhase.PROXIMITY) ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
          </div>
          <div className="relative">
            <Key className="w-5 h-5 md:w-6 md:h-6 mb-2" />
            <span className="block text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-500 text-center">Phase 01</span>
            <span className="block text-xs md:text-sm font-bold text-center mt-1">PROXIMITY</span>
          </div>
        </div>

        <div className={`relative flex flex-col items-center p-3 md:p-5 border-2 rounded-2xl transition-all duration-500 overflow-hidden group ${getPhaseStyles(LockPhase.FINGERPRINT)}`}>
          <div className={`absolute inset-0 transition-opacity duration-500 ${isVerified(LockPhase.FINGERPRINT) ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
          </div>
          <div className="relative">
            <Fingerprint className="w-5 h-5 md:w-6 md:h-6 mb-2" />
            <span className="block text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-500 text-center">Phase 02</span>
            <span className="block text-xs md:text-sm font-bold text-center mt-1">BIOMETRIC</span>
          </div>
        </div>

        <div className={`relative flex flex-col items-center p-3 md:p-5 border-2 rounded-2xl transition-all duration-500 overflow-hidden group ${getPhaseStyles(LockPhase.VEIN)}`}>
          <div className={`absolute inset-0 transition-opacity duration-500 ${isVerified(LockPhase.VEIN) ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
          </div>
          <div className="relative">
            <ScanEye className="w-5 h-5 md:w-6 md:h-6 mb-2" />
            <span className="block text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-500 text-center">Phase 03</span>
            <span className="block text-xs md:text-sm font-bold text-center mt-1">VEIN MAP</span>
          </div>
        </div>
      </div>

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-[100px] md:blur-[120px] rounded-full animate-pulse" />
      </div>
    </div>
  );
};

export default LockVisualizer;
