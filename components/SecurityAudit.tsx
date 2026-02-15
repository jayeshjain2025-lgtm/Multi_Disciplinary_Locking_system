
import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface SecurityAuditProps {
  report: string | null;
  isLoading: boolean;
}

const SecurityAudit: React.FC<SecurityAuditProps> = ({ report, isLoading }) => {
  return (
    <div className="flex-1 overflow-y-auto pr-2">
      {isLoading ? (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-sm animate-pulse">Consulting Gemini Neural Core...</p>
        </div>
      ) : report ? (
        <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-xl prose prose-invert prose-sm max-w-none">
          <div className="flex items-center gap-2 mb-3 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-bold text-xs uppercase tracking-widest">Audit Summary</span>
          </div>
          <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
            {typeof report === 'string' ? report : String(report)}
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl">
          <ShieldCheck className="w-10 h-10 text-slate-800 mb-2" />
          <p className="text-xs text-slate-600 uppercase font-black tracking-widest">Awaiting Logs</p>
          <p className="text-xs text-slate-500 mt-2">Generate events and trigger an audit to receive AI-driven insights on your security perimeter.</p>
        </div>
      )}
    </div>
  );
};

export default SecurityAudit;
