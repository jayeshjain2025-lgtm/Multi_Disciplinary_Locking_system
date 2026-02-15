
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, 
  Settings, 
  Monitor, 
  Link, 
  RefreshCw,
} from 'lucide-react';
import { LockPhase, SecurityEvent, LockState, ConnectionMode, AuthorizedKey } from './types';
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

      // HARDWARE/KEY VALIDATION LOGIC
      const isAnyKeyValid = authorizedKeys.some(k => k.isFingerprintRegistered && k.isVeinRegistered);
      if (!isAnyKeyValid && phase !== LockPhase.PROXIMITY) {
         addEvent(phase, 'FAILURE', "Security Breach: Unregistered hardware key detected.");
         playFeedback('fail');
         return { ...prev, activeAlarms: [...prev.activeAlarms, "Unauthorized hardware interaction"] };
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
        setTimeout(() => {
          setLockState(current => ({
            ...current,
            currentPhase: LockPhase.UNLOCKED,
            isLocked: false,
            lastAccess: new Date()
          }));
          addEvent(LockPhase.UNLOCKED, 'SUCCESS', 'All phases verified. System fully disengaged.');
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
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <Shield className="text-cyan-400 w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">TriLock Security <span className="text-slate-500 font-light">PRO</span></h1>
            <p className="text-slate-400 text-xs">Environment: <span className="text-cyan-400 font-bold uppercase">{lockState.connectionMode}</span></p>
          </div>
        </div>

        <nav className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('monitor')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'monitor' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
            <Monitor className="w-4 h-4" /> Monitoring
          </button>
          <button onClick={() => setActiveTab('manage')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'manage' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
            <Settings className="w-4 h-4" /> Management
          </button>
          <button onClick={() => setActiveTab('connect')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'connect' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
            <Link className="w-4 h-4" /> Connect
          </button>
        </nav>
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
          />
        )}
        {activeTab === 'manage' && (
          <ManagementView 
            authorizedKeys={authorizedKeys} 
            setAuthorizedKeys={setAuthorizedKeys} 
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

      <footer className="glass p-4 rounded-2xl flex items-center justify-between text-xs text-slate-500">
        <div className="flex gap-6">
          <span className="flex items-center gap-1">Heartbeat: Nominal</span>
          <span className="flex items-center gap-1">Protocol: Biometric-Z v4</span>
        </div>
        {autoLockTimer !== null && (
          <div className="text-orange-400 font-bold animate-pulse">
            AUTO-LOCK IN {autoLockTimer}s
          </div>
        )}
        <div className="mono opacity-50">0x8842_SEC_LINK</div>
      </footer>
    </div>
  );
};

export default App;
