
import React from 'react';
import { Cpu, Activity, History, AlertTriangle, RefreshCw, ScanLine, Shield } from 'lucide-react';
import { LockState, SecurityEvent, LockPhase, RegisteredDevice } from '../types';
import LockVisualizer from '../components/LockVisualizer';
import SimulationControls from '../components/SimulationControls';
import ActivityLog from '../components/ActivityLog';
import SecurityAudit from '../components/SecurityAudit';
import { analyzeSecurityLogs } from '../services/geminiService';

interface MonitoringViewProps {
  lockState: LockState;
  events: SecurityEvent[];
  onTrigger: (phase: LockPhase) => void;
  onReset: () => void;
  timer: number | null;
  toggleFaultMode: () => void;
  registeredDevices: RegisteredDevice[];
}

const MonitoringView: React.FC<MonitoringViewProps> = ({ 
  lockState, 
  events, 
  onTrigger, 
  onReset, 
  timer,
  toggleFaultMode,
  registeredDevices
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [auditReport, setAuditReport] = React.useState<string | null>(null);

  const runAudit = async () => {
    if (events.length === 0) return;
    setIsAnalyzing(true);
    try {
      const report = await analyzeSecurityLogs(events);
      setAuditReport(typeof report === 'string' ? report : String(report));
    } catch (err) {
      setAuditReport("Audit analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="glass rounded-2xl p-6 flex-1 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-100">
              <Cpu className="text-zinc-400 w-5 h-5" />
              Live Visualizer
            </h2>
            <button 
              onClick={() => onReset()}
              className="p-2 hover:bg-zinc-800/50 rounded-lg text-zinc-400 transition-colors"
              title="Manual Reset"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
             <LockVisualizer state={lockState} />
             {timer !== null && (
               <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center">
                 <div className="text-4xl font-bold text-red-500/20 tabular-nums select-none">{timer}</div>
                 <div className="text-[10px] uppercase tracking-widest text-red-500/50 font-medium">Recalibration</div>
               </div>
             )}
          </div>
          
          {lockState.connectionMode === 'SIMULATION' && (
                        <SimulationControls 
              currentPhase={lockState.currentPhase} 
              verifiedPhases={lockState.verifiedPhases}
              isFaultMode={lockState.isFaultMode}
              onTrigger={onTrigger} 
              onToggleFault={toggleFaultMode}
              registeredDevices={registeredDevices}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-5 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold tracking-wider uppercase">Lock Health</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold mono text-zinc-100">{lockState.batteryLevel}%</div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-emerald-400 h-full" style={{ width: `${lockState.batteryLevel}%` }} />
            </div>
          </div>
          <div className="glass p-5 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">Last Event</span>
            <div className="text-xl font-bold truncate text-zinc-100">
              {lockState.lastAccess ? lockState.lastAccess.toLocaleTimeString() : 'IDLE'}
            </div>
            <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium mt-1"><History className="w-3 h-3" /> System Stable</span>
          </div>
          <div className="glass p-5 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">Anomalies</span>
            <div className={`text-2xl font-bold ${lockState.activeAlarms.length > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-100'}`}>
              {lockState.activeAlarms.length}
            </div>
            <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium mt-1"><AlertTriangle className="w-3 h-3" /> Security Scans Active</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6">
        <ActivityLog events={events} />
        <div className="glass rounded-2xl p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-100">
              <ScanLine className="text-zinc-400 w-5 h-5" /> AI Audit
            </h2>
            <button 
              onClick={runAudit}
              disabled={isAnalyzing || events.length === 0}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-900 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
            >
              {isAnalyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
              ANALYZE
            </button>
          </div>
          <SecurityAudit report={auditReport} isLoading={isAnalyzing} />
        </div>
      </div>
    </div>
  );
};

export default MonitoringView;
