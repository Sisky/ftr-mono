import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Command, WorkerEvent, Snapshot } from '@ftr-mono/protocol';

export function useCounterWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [lastFib, setLastFib] = useState<bigint | null>(null);
  // React won't rerender primitives that stay the same. so this is needed to make sure every fib shows the alert even when duped.
  const [lastFibTick, setLastFibTick] = useState(0);
  // Signal used to indicate that the worker acknowledged quit
  const [quitAckTick, setQuitAckTick] = useState(0);

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
          // Worker already posted a final snapshot before acknowledging quit.
          // Signal to the UI that quit has completed so it can show farewell UI.
          setQuitAckTick((x) => x + 1);
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
    quitAckTick,
    running: snapshot?.running ?? false,
    inputNumber: (n: bigint) => send({ type: 'INPUT_NUMBER', value: n }),
    halt: () => send({ type: 'HALT' }),
    resume: () => send({ type: 'RESUME' }),
    refresh: () => send({ type: 'REQUEST_SNAPSHOT' }),
    setIntervalMs: (ms: number) => send({ type: 'SET_INTERVAL', ms }),
    quit: () => {
      // sk the worker to quit. It will emit a final snapshot followed by QUIT_ACK.
      send({ type: 'QUIT' });
    },
  }), [snapshot, lastFib, lastFibTick, quitAckTick, send]);
}
