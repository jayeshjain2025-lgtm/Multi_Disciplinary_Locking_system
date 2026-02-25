
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, 
  Settings, 
  Monitor, 
  Link, 
  RefreshCw,
} from 'lucide-react';
import { LockPhase, SecurityEvent, LockState, ConnectionMode, AuthorizedKey, RegisteredDevice } from './types';
import { useNativeProximity } from './hooks/useNativeProximity';
import MonitoringView from './views/MonitoringView';
import ManagementView from './views/ManagementView';
import ConnectionView from './views/ConnectionView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'manage' | 'connect'>('monitor');
  const [lockState, setLockState] = useState<LockState>({
    currentPhase: LockPhase.IDLE,
    verifiedPhases: [],
    isLocked: true,
    batteryLevel: 94,
    lastAccess: null,
    activeAlarms: [],
    connectionMode: 'SIMULATION',
    isFaultMode: false,
  });
  
  const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [registeredDevices, setRegisteredDevices] = useState<RegisteredDevice[]>([]);
  const [authorizedKeys, setAuthorizedKeys] = useState<AuthorizedKey[]>([ 
    { id: 'KEY-001', name: 'Master Key A', isFingerprintRegistered: true, isVeinRegistered: true, batteryLevel: 85 }
  ]);
  
  const [autoLockTimer, setAutoLockTimer] = useState<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const playFeedback = (type: 'success' | 'fail' | 'click') => {
    if (!audioContext.current) audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();
    osc.connect(gain);
    gain.connect(audioContext.current.destination);
    
    if (type === 'success') {
      osc.frequency.setValueAtTime(880, audioContext.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, audioContext.current.currentTime + 0.1);
    } else if (type === 'fail') {
      osc.frequency.setValueAtTime(220, audioContext.current.currentTime);
      osc.frequency.linearRampToValueAtTime(110, audioContext.current.currentTime + 0.2);
    } else {
      osc.frequency.setValueAtTime(440, audioContext.current.currentTime);
    }
    
    gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
    osc.start();
    osc.stop(audioContext.current.currentTime + 0.1);
  };

  const addEvent = useCallback((phase: LockPhase, status: 'SUCCESS' | 'FAILURE' | 'PENDING', rawDetails: any) => {
    const details = typeof rawDetails === 'string' ? rawDetails : String(rawDetails || "System Event");
    const newEvent: SecurityEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      phase,
      status,
      details,
      source: lockState.connectionMode,
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
  }, [lockState.connectionMode]);

  const resetSystem = useCallback((rawReason?: any) => {
    const reason = (typeof rawReason === 'string' && rawReason) ? rawReason : "System manually reset.";
    setLockState(prev => ({
      ...prev,
      currentPhase: LockPhase.IDLE,
      verifiedPhases: [],
      isLocked: true,
      activeAlarms: [],
    }));
    addEvent(LockPhase.IDLE, 'PENDING', reason);
    playFeedback('click');
  }, [addEvent]);

  const authorizedMacs = registeredDevices.filter(d => d.type === 'BLUETOOTH').map(d => d.id);

  const { isScanning, connectedDevice, sendUnlockSignal } = useNativeProximity(
    authorizedMacs,
    useCallback(() => {
      setLockState(prev => {
        if (!prev.verifiedPhases.includes(LockPhase.PROXIMITY)) {
          addEvent(LockPhase.PROXIMITY, 'SUCCESS', 'Auto-Unlock: Linked Bluetooth device detected in range.');
          playFeedback('success');
          
          const newVerified = [...prev.verifiedPhases, LockPhase.PROXIMITY];
          const required = [LockPhase.PROXIMITY, LockPhase.FINGERPRINT, LockPhase.VEIN];
          const allVerified = required.every(p => newVerified.includes(p));

          if (allVerified) {
            setTimeout(async () => {
              // Send the physical unlock signal to the ESP32
              const signalSent = await sendUnlockSignal();
              
              setLockState(current => ({
                ...current,
                currentPhase: LockPhase.UNLOCKED,
                isLocked: false,
                lastAccess: new Date()
              }));
              addEvent(LockPhase.UNLOCKED, 'SUCCESS', signalSent ? 'ESP32 Relay Triggered. System fully disengaged.' : 'All phases verified, but failed to trigger ESP32 relay.');
            }, 800);
            return { ...prev, verifiedPhases: newVerified, currentPhase: LockPhase.PROXIMITY };
          }
          return { ...prev, verifiedPhases: newVerified, currentPhase: LockPhase.PROXIMITY };
        }
        return prev;
      });
    }, [addEvent, sendUnlockSignal]),
    useCallback(() => {
      setLockState(prev => {
        addEvent(LockPhase.IDLE, 'FAILURE', 'Auto-Lock: Linked Bluetooth device went out of range.');
        playFeedback('fail');
        return { ...prev, currentPhase: LockPhase.IDLE, verifiedPhases: [], isLocked: true, activeAlarms: [] };
      });
    }, [addEvent])
  );

  useEffect(() => {
    let interval: any;
    if (!lockState.isLocked && lockState.currentPhase === LockPhase.UNLOCKED) {
      setAutoLockTimer(10);
      interval = setInterval(() => {
        setAutoLockTimer((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            resetSystem("Auto-lock protocol initiated.");
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setAutoLockTimer(null);
    }
    return () => clearInterval(interval);
  }, [lockState.isLocked, lockState.currentPhase, resetSystem]);

  const handlePhaseTrigger = useCallback((phase: LockPhase) => {
    playFeedback('click');

    setLockState(prev => {
      // DISCONNECT LOGIC: If clicking a phase that is already verified, remove it.
      if (prev.verifiedPhases.includes(phase)) {
        const newVerified = prev.verifiedPhases.filter(p => p !== phase);
        addEvent(phase, 'PENDING', `Parameter disconnected: ${phase.replace('_VERIFIED', '')}`);
        return { 
          ...prev, 
          verifiedPhases: newVerified, 
          currentPhase: newVerified.length > 0 ? newVerified[newVerified.length - 1] : LockPhase.IDLE,
          isLocked: true 
        };
      }

      // FAULT INJECTION LOGIC
      if (prev.isFaultMode && prev.connectionMode === 'SIMULATION') {
        addEvent(phase, 'FAILURE', `Fault Injection: Hardware malfunction detected in ${phase.replace('_VERIFIED', '')} circuit.`);
        playFeedback('fail');
        return { ...prev, activeAlarms: [...prev.activeAlarms, `Simulated ${phase} Malfunction`] };
      }

      // SIMULATION & HARDWARE VALIDATION LOGIC
      if (prev.connectionMode === 'SIMULATION') {
        if (phase === LockPhase.PROXIMITY) {
          const device = registeredDevices.find(d => d.type === 'BLUETOOTH');
          if (!device) {
            addEvent(phase, 'FAILURE', 'Proximity check failed: No registered Bluetooth device in range.');
            playFeedback('fail');
            return prev;
          }
        }
        if (phase === LockPhase.FINGERPRINT) {
          const device = registeredDevices.find(d => d.type === 'PHONE');
          if (!device) {
            addEvent(phase, 'FAILURE', 'Biometric scan failed: No registered phone found.');
            playFeedback('fail');
            return prev;
          }
        }
      } else { // HARDWARE MODE
        const isAnyKeyValid = authorizedKeys.some(k => k.isFingerprintRegistered && k.isVeinRegistered);
        if (!isAnyKeyValid && (phase === LockPhase.FINGERPRINT || phase === LockPhase.VEIN)) {
           addEvent(phase, 'FAILURE', "Security Breach: Unregistered hardware key detected.");
           playFeedback('fail');
           return { ...prev, activeAlarms: [...prev.activeAlarms, "Unauthorized hardware interaction"] };
        }
      }

      // SUCCESSFUL VERIFICATION (NON-LINEAR)
      const newVerified = [...prev.verifiedPhases, phase];
      const details = `${phase.replace('_VERIFIED', '')} signal successfully captured and verified.`;
      addEvent(phase, 'SUCCESS', details);
      playFeedback('success');

      // Check if all 3 biometric/proximity steps are complete
      const required = [LockPhase.PROXIMITY, LockPhase.FINGERPRINT, LockPhase.VEIN];
      const allVerified = required.every(p => newVerified.includes(p));

      if (allVerified) {
        setTimeout(async () => {
          // Send the physical unlock signal to the ESP32
          const signalSent = await sendUnlockSignal();
          
          setLockState(current => ({
            ...current,
            currentPhase: LockPhase.UNLOCKED,
            isLocked: false,
            lastAccess: new Date()
          }));
          addEvent(LockPhase.UNLOCKED, 'SUCCESS', signalSent ? 'ESP32 Relay Triggered. System fully disengaged.' : 'All phases verified, but failed to trigger ESP32 relay.');
        }, 800);
        return { ...prev, verifiedPhases: newVerified, currentPhase: phase };
      }

      return { ...prev, verifiedPhases: newVerified, currentPhase: phase };
    });
  }, [addEvent, authorizedKeys, resetSystem]);

  const toggleFaultMode = useCallback(() => {
    setLockState(prev => ({ ...prev, isFaultMode: !prev.isFaultMode }));
    playFeedback('click');
  }, []);

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8 flex flex-col gap-4 md:gap-6 max-w-[1600px] mx-auto">
      <header className="glass p-5 md:p-6 lg:p-7 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full" />
              <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5 md:p-3 rounded-2xl">
                <Shield className="text-white w-6 h-6 md:w-8 md:h-8" />
              </div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                TriLock Security
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${lockState.connectionMode === 'HARDWARE' ? 'bg-green-400 animate-pulse' : 'bg-cyan-400'}`} />
                <p className="text-xs md:text-sm text-slate-400">
                  <span className="text-cyan-400 font-semibold uppercase tracking-wider">{lockState.connectionMode}</span>
                  <span className="text-slate-600 mx-1.5">•</span>
                  <span className="text-slate-500">Active</span>
                </p>
              </div>
            </div>
          </div>

          <nav className="flex bg-black/30 backdrop-blur-sm p-1 rounded-2xl border border-white/5 shadow-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all flex-1 md:flex-initial ${
                activeTab === 'monitor'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Monitor</span>
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all flex-1 md:flex-initial ${
                activeTab === 'manage'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Manage</span>
            </button>
            <button
              onClick={() => setActiveTab('connect')}
              className={`flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all flex-1 md:flex-initial ${
                activeTab === 'connect'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Link className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Connect</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {activeTab === 'monitor' && (
                    <MonitoringView 
            lockState={lockState} 
            events={events} 
            onTrigger={handlePhaseTrigger} 
            onReset={() => resetSystem()} 
            timer={autoLockTimer}
            toggleFaultMode={toggleFaultMode}
            registeredDevices={registeredDevices}
          />
        )}
        {activeTab === 'manage' && (
                    <ManagementView 
            authorizedKeys={authorizedKeys} 
            setAuthorizedKeys={setAuthorizedKeys}
            registeredDevices={registeredDevices}
            setRegisteredDevices={setRegisteredDevices}
            addEvent={addEvent}
          />
        )}
        {activeTab === 'connect' && (
          <ConnectionView 
            mode={lockState.connectionMode} 
            setMode={(m) => {
              setLockState(prev => ({ ...prev, connectionMode: m, isFaultMode: false }));
              addEvent(LockPhase.IDLE, 'PENDING', `Switched to ${m} mode.`);
            }} 
          />
        )}
      </main>

      <footer className="glass p-4 md:p-5 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-transparent to-slate-900/20 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-slate-400">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="font-medium">System Nominal</span>
            </span>
            <span className="flex items-center gap-2 text-slate-500">
              <span>Protocol:</span>
              <span className="mono text-cyan-400 font-semibold">BIO-Z v4.2</span>
            </span>
          </div>
          {autoLockTimer !== null && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse-glow" />
              <span className="text-orange-400 font-bold text-sm">
                AUTO-LOCK {autoLockTimer}s
              </span>
            </div>
          )}
          <div className="mono text-slate-600 text-[10px] tracking-wider">
            SEC_ID: 0x8842
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
