
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
              registeredDevices={registeredDevices}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="glass p-5 md:p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group hover:border-cyan-400/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-3xl group-hover:bg-cyan-400/10 transition-all" />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Lock Health</span>
              <div className="p-2 bg-cyan-400/10 rounded-lg">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="relative text-3xl md:text-4xl font-black mono bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {lockState.batteryLevel}%
            </div>
            <div className="relative w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500 shadow-lg shadow-cyan-500/50"
                style={{ width: `${lockState.batteryLevel}%` }}
              />
            </div>
          </div>

          <div className="glass p-5 md:p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group hover:border-blue-400/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-3xl group-hover:bg-blue-400/10 transition-all" />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Last Event</span>
              <div className="p-2 bg-blue-400/10 rounded-lg">
                <History className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="relative text-xl md:text-2xl font-bold truncate">
              {lockState.lastAccess ? lockState.lastAccess.toLocaleTimeString() : 'IDLE'}
            </div>
            <span className="relative text-xs text-slate-500 flex items-center gap-2 font-medium">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              System Stable
            </span>
          </div>

          <div className="glass p-5 md:p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden group hover:border-red-400/20 transition-all">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-all ${
              lockState.activeAlarms.length > 0 ? 'bg-red-400/20' : 'bg-slate-400/5'
            }`} />
            <div className="relative flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Anomalies</span>
              <div className={`p-2 rounded-lg ${lockState.activeAlarms.length > 0 ? 'bg-red-400/20' : 'bg-slate-400/10'}`}>
                <AlertTriangle className={`w-4 h-4 ${lockState.activeAlarms.length > 0 ? 'text-red-400' : 'text-slate-500'}`} />
              </div>
            </div>
            <div className={`relative text-3xl md:text-4xl font-black mono ${
              lockState.activeAlarms.length > 0
                ? 'text-red-400 animate-pulse-glow'
                : 'text-slate-300'
            }`}>
              {lockState.activeAlarms.length}
            </div>
            <span className="relative text-xs text-slate-500 flex items-center gap-2 font-medium">
              <div className={`w-1.5 h-1.5 rounded-full ${lockState.activeAlarms.length > 0 ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`} />
              Security Scans Active
            </span>
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
