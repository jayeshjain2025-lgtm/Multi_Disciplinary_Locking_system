
import React from 'react';
import { ConnectionMode } from '../types';
import { Smartphone, Laptop, CheckCircle2, Link2, Wifi, Zap } from 'lucide-react';

interface ConnectionViewProps {
  mode: ConnectionMode;
  setMode: (m: ConnectionMode) => void;
}

const ConnectionView: React.FC<ConnectionViewProps> = ({ mode, setMode }) => {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2 text-zinc-100">Hardware Connection</h2>
        <p className="text-zinc-400">Configure how the dashboard interacts with the physical locking mechanisms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          onClick={() => setMode('SIMULATION')}
          className={`group cursor-pointer p-8 rounded-3xl border-2 transition-all flex flex-col gap-6 ${mode === 'SIMULATION' ? 'bg-emerald-500/5 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-4 rounded-2xl ${mode === 'SIMULATION' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
              <Laptop className="w-8 h-8" />
            </div>
            {mode === 'SIMULATION' && <CheckCircle2 className="text-emerald-400 w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2 text-zinc-100">Simulation Mode</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Use built-in virtual controls to test lock logic, AI auditing, and sequence protocols without external hardware.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-400 font-bold tracking-tighter uppercase">No Latency</span>
            <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-400 font-bold tracking-tighter uppercase">Local Stack</span>
          </div>
        </div>

        <div 
          onClick={() => setMode('HARDWARE')}
          className={`group cursor-pointer p-8 rounded-3xl border-2 transition-all flex flex-col gap-6 ${mode === 'HARDWARE' ? 'bg-purple-500/5 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.1)]' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-4 rounded-2xl ${mode === 'HARDWARE' ? 'bg-purple-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
              <Smartphone className="w-8 h-8" />
            </div>
            {mode === 'HARDWARE' && <CheckCircle2 className="text-purple-400 w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2 text-zinc-100">Hardware Link</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Pair with physical TriLock devices via Bluetooth Low Energy (BLE) or Secure MQTT. Real-time sensor feedback.
            </p>
          </div>
          {mode === 'HARDWARE' ? (
            <div className="flex flex-col gap-3 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
               <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                 <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> SCANNING FOR DEVICES...</span>
                 <Zap className="w-3 h-3 animate-pulse" />
               </div>
               <div className="flex items-center gap-2 text-zinc-300 text-sm italic">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                  Attempting to link with key-fob #B2...
               </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-auto">
              <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-400 font-bold tracking-tighter uppercase">BLE v5.2</span>
              <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-400 font-bold tracking-tighter uppercase">Encrypted MQTT</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 glass p-6 rounded-3xl flex items-center gap-6">
        <div className="p-4 bg-zinc-800/50 rounded-2xl">
          <Link2 className="text-zinc-400 w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-zinc-100">Protocol Integration</h4>
          <p className="text-xs text-zinc-500 mt-1">
            Current session is using AES-256 wrapping for all verification tokens. Switching modes will re-initialize the security handshake.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionView;
