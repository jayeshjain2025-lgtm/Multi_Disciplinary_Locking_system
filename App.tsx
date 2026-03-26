
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, 
  Settings, 
  Monitor, 
  Link, 
  RefreshCw,
} from 'lucide-react';
import { LockPhase, SecurityEvent, LockState, ConnectionMode, AuthorizedKey, RegisteredDevice } from './types';
import { useTransport } from './hooks/useTransport';
import { LockEvent } from './services/transport/ITransport';
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
    connectionMode: 'BLE',
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

  const { transport, status, connect, disconnect } = useTransport({
    mode: lockState.connectionMode,
    simulationConfig: {
      proximityFailureRate: lockState.isFaultMode ? 1.0 : 0,
      fingerprintFailureRate: lockState.isFaultMode ? 1.0 : 0,
      veinFailureRate: lockState.isFaultMode ? 1.0 : 0,
      autoUnlockAllPhases: false
    }
  });

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
    if (transport) {
      transport.sendCommand({ id: Math.random().toString(), type: 'FORCE_LOCK' }).catch(console.error);
    }
  }, [addEvent, transport]);

  useEffect(() => {
    if (!transport) return;

    const handleLockEvent = (event: LockEvent) => {
      let phase = LockPhase.IDLE;
      if (event.phase === 1) phase = LockPhase.PROXIMITY;
      if (event.phase === 2) phase = LockPhase.FINGERPRINT;
      if (event.phase === 3) phase = LockPhase.VEIN;

      let status: 'SUCCESS' | 'FAILURE' | 'PENDING' = 'PENDING';
      if (event.type === 'PHASE_UNLOCKED' || event.type === 'LOCK_DISENGAGED') status = 'SUCCESS';
      if (event.type === 'PHASE_FAILED' || event.type === 'FAULT' || event.type === 'ALARM') status = 'FAILURE';

      const details = event.metadata?.reason ? String(event.metadata.reason) : event.type;

      if (event.type === 'PROXIMITY_DETECTED') {
        addEvent(LockPhase.PROXIMITY, 'SUCCESS', 'Auto-Unlock: Linked Bluetooth device detected in range.');
        playFeedback('success');
        setLockState(prev => {
          if (!prev.verifiedPhases.includes(LockPhase.PROXIMITY)) {
            const newVerified = [...prev.verifiedPhases, LockPhase.PROXIMITY];
            const required = [LockPhase.PROXIMITY, LockPhase.FINGERPRINT, LockPhase.VEIN];
            if (required.every(p => newVerified.includes(p))) {
              transport.sendCommand({ id: Math.random().toString(), type: 'FORCE_UNLOCK' }).catch(console.error);
            }
            return { ...prev, verifiedPhases: newVerified, currentPhase: LockPhase.PROXIMITY };
          }
          return prev;
        });
        return;
      }

      if (event.type === 'PROXIMITY_LOST') {
        addEvent(LockPhase.IDLE, 'FAILURE', 'Auto-Lock: Linked Bluetooth device went out of range.');
        playFeedback('fail');
        setLockState(prev => ({ ...prev, currentPhase: LockPhase.IDLE, verifiedPhases: [], isLocked: true, activeAlarms: [] }));
        transport.sendCommand({ id: Math.random().toString(), type: 'FORCE_LOCK' }).catch(console.error);
        return;
      }

      if (event.type === 'CONNECTION_ESTABLISHED') {
        addEvent(LockPhase.IDLE, 'SUCCESS', 'Transport connection established.');
        return;
      }

      if (event.type === 'CONNECTION_LOST') {
        addEvent(LockPhase.IDLE, 'FAILURE', 'Transport connection lost.');
        setLockState(prev => ({ ...prev, currentPhase: LockPhase.IDLE, verifiedPhases: [], isLocked: true }));
        return;
      }

      addEvent(phase, status, details);

      setLockState(prev => {
        if (event.type === 'PHASE_UNLOCKED' && event.phase) {
          playFeedback('success');
          const newVerified = [...prev.verifiedPhases, phase];
          const required = [LockPhase.PROXIMITY, LockPhase.FINGERPRINT, LockPhase.VEIN];
          if (required.every(p => newVerified.includes(p))) {
            transport.sendCommand({ id: Math.random().toString(), type: 'FORCE_UNLOCK' }).catch(console.error);
          }
          return { ...prev, verifiedPhases: newVerified, currentPhase: phase };
        }
        
        if (event.type === 'PHASE_FAILED') {
          playFeedback('fail');
          return { ...prev, activeAlarms: [...prev.activeAlarms, `${phase} Verification Failed`] };
        }

        if (event.type === 'LOCK_DISENGAGED') {
          playFeedback('success');
          return { ...prev, currentPhase: LockPhase.UNLOCKED, isLocked: false, lastAccess: new Date() };
        }
        
        if (event.type === 'LOCK_ENGAGED') {
          return { ...prev, currentPhase: LockPhase.IDLE, isLocked: true, verifiedPhases: [] };
        }
        
        return prev;
      });
    };

    transport.onEvent(handleLockEvent);
    return () => transport.offEvent(handleLockEvent);
  }, [transport, addEvent]);

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
      return prev;
    });

    if (!transport) return;

    let phaseNum: 1 | 2 | 3 | undefined;
    if (phase === LockPhase.PROXIMITY) phaseNum = 1;
    if (phase === LockPhase.FINGERPRINT) phaseNum = 2;
    if (phase === LockPhase.VEIN) phaseNum = 3;

    if (phaseNum) {
      transport.sendCommand({
        id: Math.random().toString(),
        type: 'REQUEST_PHASE_UNLOCK',
        payload: { phase: phaseNum }
      }).catch(console.error);
    }
  }, [transport, addEvent]);

  const toggleFaultMode = useCallback(() => {
    setLockState(prev => ({ ...prev, isFaultMode: !prev.isFaultMode }));
    playFeedback('click');
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <Shield className="text-zinc-100 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">TriLock <span className="text-zinc-500 font-normal">PRO</span></h1>
            <p className="text-zinc-500 text-xs mt-0.5">Environment: <span className="text-emerald-400 font-medium uppercase">{lockState.connectionMode}</span></p>
          </div>
        </div>

        <nav className="flex bg-zinc-950/50 p-1 rounded-xl border border-zinc-800/80">
          <button onClick={() => setActiveTab('monitor')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'monitor' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'}`}>
            <Monitor className="w-4 h-4" /> Monitoring
          </button>
          <button onClick={() => setActiveTab('manage')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'manage' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'}`}>
            <Settings className="w-4 h-4" /> Management
          </button>
          <button onClick={() => setActiveTab('connect')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'connect' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'}`}>
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

      <footer className="glass p-4 rounded-2xl flex items-center justify-between text-xs text-zinc-500 font-medium">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Heartbeat: Nominal</span>
          <span className="flex items-center gap-1">Protocol: Biometric-Z v4</span>
        </div>
        {autoLockTimer !== null && (
          <div className="text-red-400 font-bold animate-pulse">
            AUTO-LOCK IN {autoLockTimer}s
          </div>
        )}
        <div className="mono opacity-40">0x8842_SEC_LINK</div>
      </footer>
    </div>
  );
};

export default App;
