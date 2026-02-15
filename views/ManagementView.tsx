
import React, { useState } from 'react';
import { UserPlus, Trash2, Fingerprint, ScanFace, HardDrive, ShieldCheck, AlertCircle } from 'lucide-react';
import { AuthorizedKey, LockPhase } from '../types';

interface ManagementViewProps {
  authorizedKeys: AuthorizedKey[];
  setAuthorizedKeys: React.Dispatch<React.SetStateAction<AuthorizedKey[]>>;
  addEvent: (phase: LockPhase, status: 'SUCCESS' | 'FAILURE' | 'PENDING', details: string) => void;
}

const ManagementView: React.FC<ManagementViewProps> = ({ authorizedKeys, setAuthorizedKeys, addEvent }) => {
  const [newKeyName, setNewKeyName] = useState('');

  const addKey = () => {
    if (!newKeyName.trim()) return;
    const newKey: AuthorizedKey = {
      id: `KEY-${Math.floor(Math.random() * 900) + 100}`,
      name: newKeyName,
      isFingerprintRegistered: false,
      isVeinRegistered: false,
      batteryLevel: 100,
    };
    setAuthorizedKeys([...authorizedKeys, newKey]);
    setNewKeyName('');
    addEvent(LockPhase.IDLE, 'SUCCESS', `Admin: Registered new hardware key [${newKey.id}]`);
  };

  const removeKey = (id: string) => {
    setAuthorizedKeys(authorizedKeys.filter(k => k.id !== id));
    addEvent(LockPhase.IDLE, 'SUCCESS', `Admin: Revoked key [${id}]`);
  };

  const toggleBiometric = (id: string, field: 'isFingerprintRegistered' | 'isVeinRegistered') => {
    setAuthorizedKeys(authorizedKeys.map(k => 
      k.id === id ? { ...k, [field]: !k[field] } : k
    ));
    addEvent(LockPhase.IDLE, 'SUCCESS', `Admin: Updated biometrics for [${id}]`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 flex flex-col gap-6">
        <div className="glass p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <UserPlus className="text-cyan-400 w-5 h-5" /> Register Hardware
          </h2>
          <p className="text-slate-400 text-sm mb-4">Add a new physical key to the security perimeter.</p>
          <div className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Hardware Tag (e.g. CEO Key)" 
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button 
              onClick={addKey}
              className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-bold text-sm transition-all"
            >
              Link New Device
            </button>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl bg-orange-900/10 border-orange-500/20">
          <div className="flex gap-3">
            <AlertCircle className="text-orange-400 w-8 h-8 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-orange-200">Security Warning</h3>
              <p className="text-xs text-orange-200/60 mt-1 leading-relaxed">
                Modifying hardware keys requires Admin Level 4 clearance. All changes are logged to the immutable security chain.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-8">
        <div className="glass rounded-2xl p-6 h-full">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <HardDrive className="text-slate-400 w-5 h-5" /> Authorized Fleet
          </h2>
          
          <div className="space-y-4">
            {authorizedKeys.map(key => (
              <div key={key.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-white/10">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-bold text-slate-400 mono">{key.id}</span>
                    <h3 className="font-bold text-lg">{key.name}</h3>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${key.batteryLevel > 20 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs text-slate-500">Batt: {key.batteryLevel}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => toggleBiometric(key.id, 'isFingerprintRegistered')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${key.isFingerprintRegistered ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                  >
                    <Fingerprint className="w-4 h-4" />
                    {key.isFingerprintRegistered ? 'FP ENROLLED' : 'NO FP'}
                  </button>
                  <button 
                    onClick={() => toggleBiometric(key.id, 'isVeinRegistered')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${key.isVeinRegistered ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                  >
                    <ScanFace className="w-4 h-4" />
                    {key.isVeinRegistered ? 'VEIN MAP READY' : 'NO VEIN'}
                  </button>
                  <div className="w-px h-8 bg-white/10 mx-2 hidden md:block" />
                  <button 
                    onClick={() => removeKey(key.id)}
                    className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-all"
                    title="Revoke Access"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {authorizedKeys.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl text-slate-600">
                <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p>No hardware keys linked. System is in lock-down.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementView;
