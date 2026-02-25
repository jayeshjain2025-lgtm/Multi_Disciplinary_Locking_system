
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

  const sendUnlockSignalRef = useRef<(() => Promise<boolean>) | null>(null);

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
              const signalSent = sendUnlockSignalRef.current ? await sendUnlockSignalRef.current() : false;
              
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
    }, [addEvent]),
    useCallback(() => {
      setLockState(prev => {
        addEvent(LockPhase.IDLE, 'FAILURE', 'Auto-Lock: Linked Bluetooth device went out of range.');
        playFeedback('fail');
        return { ...prev, currentPhase: LockPhase.IDLE, verifiedPhases: [], isLocked: true, activeAlarms: [] };
      });
    }, [addEvent])
  );

  useEffect(() => {
    sendUnlockSignalRef.current = sendUnlockSignal;
  }, [sendUnlockSignal]);

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
          const signalSent = sendUnlockSignalRef.current ? await sendUnlockSignalRef.current() : false;
          
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
