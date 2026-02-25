
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
        <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          <p className="text-sm animate-pulse">Consulting Gemini Neural Core...</p>
        </div>
      ) : report ? (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl prose prose-invert prose-sm max-w-none">
          <div className="flex items-center gap-2 mb-3 text-zinc-100">
            <ShieldCheck className="w-5 h-5 text-zinc-400" />
            <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">Audit Summary</span>
          </div>
          <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">
            {typeof report === 'string' ? report : String(report)}
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-zinc-950/50 border border-dashed border-zinc-800 rounded-xl">
          <ShieldCheck className="w-10 h-10 text-zinc-700 mb-2" />
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Awaiting Logs</p>
          <p className="text-xs text-zinc-600 mt-2">Generate events and trigger an audit to receive AI-driven insights on your security perimeter.</p>
        </div>
      )}
    </div>
  );
};

export default SecurityAudit;
