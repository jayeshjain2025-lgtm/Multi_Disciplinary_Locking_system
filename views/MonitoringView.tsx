
import React from 'react';
import { Cpu, Activity, History, AlertTriangle, RefreshCw, ScanLine, Shield } from 'lucide-react';
import { LockState, SecurityEvent, LockPhase } from '../types';
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
}

const MonitoringView: React.FC<MonitoringViewProps> = ({ 
  lockState, 
  events, 
  onTrigger, 
  onReset, 
  timer,
  toggleFaultMode 
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
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Cpu className="text-cyan-400 w-5 h-5" />
              Live Visualizer
            </h2>
            <button 
              onClick={() => onReset()}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
              title="Manual Reset"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
             <LockVisualizer state={lockState} />
             {timer !== null && (
               <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center">
                 <div className="text-4xl font-bold text-orange-400/20 tabular-nums select-none">{timer}</div>
                 <div className="text-[10px] uppercase tracking-widest text-orange-400/50">Recalibration</div>
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
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-5 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Lock Health</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold mono">{lockState.batteryLevel}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full" style={{ width: `${lockState.batteryLevel}%` }} />
            </div>
          </div>
          <div className="glass p-5 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold uppercase text-slate-400">Last Event</span>
            <div className="text-xl font-bold truncate">
              {lockState.lastAccess ? lockState.lastAccess.toLocaleTimeString() : 'IDLE'}
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1"><History className="w-3 h-3" /> System Stable</span>
          </div>
          <div className="glass p-5 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold uppercase text-slate-400">Anomalies</span>
            <div className={`text-2xl font-bold ${lockState.activeAlarms.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
              {lockState.activeAlarms.length}
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Security Scans Active</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6">
        <ActivityLog events={events} />
        <div className="glass rounded-2xl p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ScanLine className="text-purple-400 w-5 h-5" /> AI Audit
            </h2>
            <button 
              onClick={runAudit}
              disabled={isAnalyzing || events.length === 0}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2"
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
