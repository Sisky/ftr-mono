import { beforeEach, describe, expect, it, vi } from 'vitest';

type Command =
  | { type: 'START' }
  | { type: 'HALT' }
  | { type: 'RESUME' }
  | { type: 'QUIT' }
  | { type: 'INPUT_NUMBER'; value: bigint }
  | { type: 'REQUEST_SNAPSHOT' }
  | { type: 'SET_INTERVAL'; ms: number }
  | { type: string; [k: string]: unknown };

type Snapshot = {
  running: boolean;
  totalInputs: number;
  top: Array<{ value: bigint; count: number }>;
  lastUpdated: number;
};

type WorkerEvent =
  | { type: 'SNAPSHOT'; payload: Snapshot }
  | { type: 'FIB_ALERT'; value: bigint }
  | { type: 'QUIT_ACK' };

let messages: WorkerEvent[] = [];
let messageHandler: ((e: MessageEvent<Command>) => void) | null = null;

function setupMockWorkerScope() {
  messages = [];
  messageHandler = null;

  const mockSelf = {
    addEventListener: (type: string, handler: (e: MessageEvent<Command>) => void) => {
      if (type === 'message') messageHandler = handler;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeEventListener: (_type: string, _handler: (e: MessageEvent<Command>) => void) => {
      // no-op
    },
    postMessage: (msg: WorkerEvent) => {
      messages.push(msg);
    },
  } as unknown as WorkerGlobalScope;

  // install globals expected by the worker module
  // self.addEventListener(...) is used for subscribing
  // postMessage(...) (global) is used for publishing
  // Also provide clearInterval/setInterval from real env
  Object.defineProperty(globalThis, 'self', { configurable: true, value: mockSelf });
  Object.defineProperty(globalThis, 'postMessage', {
    configurable: true,
    // ensure `this` is not used
    value: (msg: WorkerEvent) => mockSelf.postMessage(msg),
  });
}

async function importWorkerModule() {
  await import('../counterWorker.ts');
  if (!messageHandler) throw new Error('Worker did not register message handler');
}

function send(cmd: Command) {
  if (!messageHandler) throw new Error('Message handler not set');
  const evt = { data: cmd } as unknown as MessageEvent<Command>;
  return messageHandler(evt);
}

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.resetModules();
  setupMockWorkerScope();
  await importWorkerModule();
});

describe('counterWorker', () => {
  it('START posts an immediate SNAPSHOT with running=true', () => {
    send({ type: 'START' });

    const last = messages.at(-1);
    expect(last && last.type).toBe('SNAPSHOT');
    const snap = (last as Extract<WorkerEvent, { type: 'SNAPSHOT' }>).payload;
    expect(snap.running).toBe(true);
    expect(typeof snap.lastUpdated).toBe('number');
  });

  it('INPUT_NUMBER posts FIB_ALERT for Fibonacci numbers', () => {
    send({ type: 'START' });
    messages.length = 0;

    send({ type: 'INPUT_NUMBER', value: 8n });
    expect(messages.some((m) => m.type === 'FIB_ALERT' && m.value === 8n)).toBe(true);
  });

  it('INPUT_NUMBER ignores non-integers (no count increment, no alerts)', () => {
    send({ type: 'START' });
    messages.length = 0;
    send({ type: 'INPUT_NUMBER', value: 3.14 as unknown as bigint });

    // No messages should have been posted for a non-integer input
    expect(messages.length).toBe(0);

    // Request a snapshot to verify totals are unchanged (still zero)
    send({ type: 'REQUEST_SNAPSHOT' });
    const lastSnap = messages.at(-1)!;
    if (lastSnap.type !== 'SNAPSHOT') throw new Error('Expected SNAPSHOT');
    const snap = lastSnap.payload;
    expect(snap.totalInputs).toBe(0);
  });

  it('INPUT_NUMBER integer that is not Fibonacci updates counts but does not alert', () => {
    send({ type: 'START' });
    messages.length = 0;

    send({ type: 'INPUT_NUMBER', value: 4n }); // 4 is not Fibonacci

    // Should not produce any FIB_ALERT
    expect(messages.some((m) => m.type === 'FIB_ALERT')).toBe(false);

    // Ask for a snapshot to assert count incremented
    send({ type: 'REQUEST_SNAPSHOT' });
    const lastSnap2 = messages.at(-1)!;
    if (lastSnap2.type !== 'SNAPSHOT') throw new Error('Expected SNAPSHOT');
    const snap = lastSnap2.payload;
    expect(snap.totalInputs).toBe(1);
    expect(snap.top.some((x: { value: bigint; count: number }) => x.value === 4n && x.count === 1)).toBe(true);
  });

  it('HALT and RESUME toggle running state in subsequent SNAPSHOTs', () => {
    send({ type: 'START' });

    send({ type: 'HALT' });
    let last = messages.at(-1)!;
    expect(last.type).toBe('SNAPSHOT');
    if (last.type !== 'SNAPSHOT') throw new Error('Expected SNAPSHOT');
    expect(last.payload.running).toBe(false);

    send({ type: 'RESUME' });
    last = messages.at(-1)!;
    expect(last.type).toBe('SNAPSHOT');
    if (last.type !== 'SNAPSHOT') throw new Error('Expected SNAPSHOT');
    expect(last.payload.running).toBe(true);
  });

  it('REQUEST_SNAPSHOT returns a SNAPSHOT without changing state', () => {
    send({ type: 'START' });
    messages.length = 0;

    send({ type: 'REQUEST_SNAPSHOT' });
    const last = messages.at(-1)!;
    expect(last.type).toBe('SNAPSHOT');
  });

  it('SET_INTERVAL posts a SNAPSHOT acknowledging change', () => {
    send({ type: 'START' });
    messages.length = 0;

    send({ type: 'SET_INTERVAL', ms: 2500 });
    const last = messages.at(-1)!;
    expect(last.type).toBe('SNAPSHOT');
  });

  it('QUIT stops and clears, then QUIT_ACK is posted and subsequent snapshot shows totals reset', () => {
    send({ type: 'START' });
    send({ type: 'INPUT_NUMBER', value: 5n });

    messages.length = 0;
    send({ type: 'QUIT' });

    // Expect QUIT_ACK
    expect(messages.some((m) => m.type === 'QUIT_ACK')).toBe(true);

    // Request a snapshot after quit; totals should be zeroed
    messages.length = 0;
    send({ type: 'REQUEST_SNAPSHOT' });
    const last = messages.at(-1)!;
    expect(last.type).toBe('SNAPSHOT');
    const snap = (last as Extract<WorkerEvent, { type: 'SNAPSHOT' }>).payload;
    expect(snap.running).toBe(false);
    expect(snap.totalInputs).toBe(0);
    expect(snap.top.length).toBe(0);
  });

  it('throws for unknown commands', () => {
    expect(() => send({ type: 'NOT_A_REAL_COMMAND' } as Command)).toThrowError(
      /Unhandled worker command/,
    );
  });

  it('throws and formats type as unknown when type is not a string', () => {
    expect(() => send({ type: 123 } as unknown as Command)).toThrowError(
      /Unhandled worker command: unknown/
    );
  });
});
