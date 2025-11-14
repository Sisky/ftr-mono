/// <reference lib="webworker" />
import { Counter, makeFibonacciSet } from '@ftr-mono/domain';
import type { Command, Snapshot, WorkerEvent } from '@ftr-mono/protocol';
import { createIntervalScheduler, type IntervalScheduler } from '@ftr-mono/scheduler';

const counter = new Counter();
const fibonacci = makeFibonacciSet(1000);

const SNAPSHOT_INTERVAL_MS = 1000;

// eslint-disable-next-line prefer-const -- must be let because it's assigned after postSnapshot is defined
let scheduler: IntervalScheduler;

function postSnapshot(): void {
  const payload: Snapshot = {
    // scheduler is initialized before any calls to postSnapshot; using direct access removes an untestable branch
    running: scheduler.running,
    totalInputs: counter.total,
    top: counter.snapshot(),
    lastUpdated: Date.now(),
  };
  postMessage({ type: 'SNAPSHOT', payload } as WorkerEvent);
}

scheduler = createIntervalScheduler({
  intervalMs: SNAPSHOT_INTERVAL_MS,
  onTick: postSnapshot,
  setIntervalFn: (fn, ms) => setInterval(fn, ms),
  clearIntervalFn: (handle) => clearInterval(handle as number),
});

self.addEventListener('message', (e: MessageEvent<Command>) => {
    const cmd = e.data;

    switch (cmd.type) {
        case 'START': {
            scheduler.start();
            postSnapshot();
            break;
        }
        case 'HALT': {
            scheduler.stop();
            postSnapshot();
            break;
        }
        case 'RESUME': {
            scheduler.start()
            postSnapshot();
            break;
        }
        case 'QUIT': {
            // Stop the scheduler so running=false is reflected in the final snapshot
            scheduler.stop();
            // Send a final snapshot with the current frequency table before clearing
            postSnapshot();
            // Now clear the internal state and acknowledge quit
            counter.clear();
            postMessage({ type: 'QUIT_ACK' } as WorkerEvent);
            break;
        }
        case 'INPUT_NUMBER': {
            if (typeof cmd.value === 'bigint') {
                counter.add(cmd.value);
                if (fibonacci.has(cmd.value)) {
                    postMessage({ type: 'FIB_ALERT', value: cmd.value } as WorkerEvent);
                }
            }
            break;
        }
        case 'REQUEST_SNAPSHOT': {
            postSnapshot();
            break;
        }
        case 'SET_INTERVAL': {
            scheduler.setIntervalMs(cmd.ms);
            postSnapshot();
            break;
        }
        default: {
            void cmd;
            // At runtime, throw to surface unexpected commands during development.
            const type = (cmd as { type?: unknown })?.type;
            const typeStr = typeof type === 'string' ? type : 'unknown';
            throw new Error(`Unhandled worker command: ${typeStr}`);
        }
    }
});
