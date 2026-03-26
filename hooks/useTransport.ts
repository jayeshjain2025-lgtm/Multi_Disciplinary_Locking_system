// ============================================================
// hooks/useTransport.ts — React hook for the transport layer
// ============================================================
// Provides the transport instance, its status, and the event
// stream to any component. Create once at app root and pass
// down via context or props.

import { useState, useEffect, useRef, useCallback } from 'react';
import { ITransport, LockEvent, TransportStatus } from '../services/transport/ITransport';
import { createTransport, TransportMode } from '../services/transport/TransportFactory';
import type { SimulationConfig } from '../services/transport/SimulationTransport';

interface UseTransportOptions {
  mode: TransportMode;
  simulationConfig?: SimulationConfig;
  /** Max events to keep in memory */
  maxEventHistory?: number;
}

interface UseTransportReturn {
  transport: ITransport | null;
  status: TransportStatus;
  events: LockEvent[];
  isConnecting: boolean;
  connectionError: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearEvents: () => void;
}

export function useTransport({
  mode,
  simulationConfig,
  maxEventHistory = 200,
}: UseTransportOptions): UseTransportReturn {
  const transportRef = useRef<ITransport | null>(null);
  const [status, setStatus] = useState<TransportStatus>({ connected: false, mode });
  const [events, setEvents] = useState<LockEvent[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Re-create transport when mode changes
  useEffect(() => {
    const t = createTransport({ mode, simulationConfig });
    transportRef.current = t;

    const handleEvent = (event: LockEvent) => {
      setEvents((prev) => {
        const next = [event, ...prev];
        return next.length > maxEventHistory ? next.slice(0, maxEventHistory) : next;
      });
    };

    const handleStatusChange = (s: TransportStatus) => {
      setStatus(s);
    };

    t.onEvent(handleEvent);
    t.onStatusChange(handleStatusChange);

    return () => {
      t.offEvent(handleEvent);
      // Disconnect cleanly on unmount / mode switch
      if (t.status.connected) {
        t.disconnect().catch(console.error);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const connect = useCallback(async () => {
    if (!transportRef.current) return;
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await transportRef.current.connect();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setConnectionError(message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!transportRef.current) return;
    await transportRef.current.disconnect();
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  return {
    transport: transportRef.current,
    status,
    events,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    clearEvents,
  };
}
