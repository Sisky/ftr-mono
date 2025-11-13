import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Command, WorkerEvent, Snapshot } from '@ftr-mono/protocol';

export function useCounterWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [lastFib, setLastFib] = useState<number | null>(null);
  // React won't rerender primitives that stay the same. so this is needed to make sure every fib shows the alert even when duped.
  const [lastFibTick, setLastFibTick] = useState(0);

  useEffect(() => {
    const worker = new Worker(new URL('../worker/counterWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    const onMessage = (e: MessageEvent<WorkerEvent>) => {
      const msg = e.data;

      switch (msg.type) {
        case 'SNAPSHOT':
          setSnapshot(msg.payload);
          break;
        case 'FIB_ALERT':
          setLastFib(msg.value);
          setLastFibTick((x) => x + 1);
          break;
        case 'QUIT_ACK':
          setSnapshot({ running: false, totalInputs: 0, top: [], lastUpdated: Date.now() });
          setLastFib(null);
          setLastFibTick((x) => x + 1);
          worker.postMessage({ type: 'REQUEST_SNAPSHOT' } satisfies Command);
          break;
      }
    };

    worker.addEventListener('message', onMessage);
    worker.postMessage({ type: 'START' } satisfies Command);

    return () => {
      worker.removeEventListener('message', onMessage);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const send = useCallback((cmd: Command) => workerRef.current?.postMessage(cmd), []);

  return useMemo(() => ({
    snapshot,
    lastFib,
    lastFibTick,
    running: snapshot?.running ?? false,
    inputNumber: (n: number) => send({ type: 'INPUT_NUMBER', value: n }),
    halt: () => send({ type: 'HALT' }),
    resume: () => send({ type: 'RESUME' }),
    refresh: () => send({ type: 'REQUEST_SNAPSHOT' }),
    setIntervalMs: (ms: number) => send({ type: 'SET_INTERVAL', ms }),
    quit: () => {
      setSnapshot({ running: false, totalInputs: 0, top: [], lastUpdated: Date.now() });
      setLastFib(null);
      setLastFibTick((x) => x + 1);
      send({ type: 'QUIT' });
    },
  }), [snapshot, lastFib, lastFibTick, send]);
}
