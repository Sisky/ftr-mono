import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useCounterWorker } from '../useCounterWorker.ts';
import type { WorkerEvent } from '@ftr-mono/protocol';

class MockWorker {
  public static instances: MockWorker[] = [];

  public onmessage: ((e: MessageEvent<WorkerEvent>) => void) | null = null;
  public postMessage = vi.fn();
  public terminate = vi.fn();
  public addEventListener = vi.fn((type: string, handler: (e: MessageEvent<WorkerEvent>) => void) => {
    if (type === 'message') {
      this.onmessage = handler;
    }
  });
  public removeEventListener = vi.fn((type: string, handler: (e: MessageEvent<WorkerEvent>) => void) => {
    if (type === 'message' && this.onmessage === handler) {
      this.onmessage = null;
    }
  });

  constructor(_url: URL, _options?: WorkerOptions) {
    void _url;
    void _options;
    MockWorker.instances.push(this);
  }
}

beforeEach(() => {
  MockWorker.instances = [];
  // Replace global Worker with mock
  Object.defineProperty(globalThis, 'Worker', {
    writable: true,
    value: MockWorker as unknown as typeof Worker,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useCounterWorker', () => {
  it('creates a worker on mount and terminates it on unmount', () => {
    const { unmount } = renderHook(() => useCounterWorker());

    expect(MockWorker.instances.length).toBe(1);
    const worker = MockWorker.instances[0]!;

    // Hook sends START on mount
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'START' });

    expect(worker.terminate).not.toHaveBeenCalled();

    unmount();

    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it('sends correct commands for input / halt / resume / refresh / setIntervalMs', () => {
    const { result } = renderHook(() => useCounterWorker());
    const worker = MockWorker.instances[0]!;

    worker.postMessage.mockClear();

    act(() => {
      result.current.inputNumber(42);
      result.current.halt();
      result.current.resume();
      result.current.refresh();
      result.current.setIntervalMs(2000);
    });

    expect(worker.postMessage).toHaveBeenNthCalledWith(1, {
      type: 'INPUT_NUMBER',
      value: 42,
    });
    expect(worker.postMessage).toHaveBeenNthCalledWith(2, { type: 'HALT' });
    expect(worker.postMessage).toHaveBeenNthCalledWith(3, { type: 'RESUME' });
    expect(worker.postMessage).toHaveBeenNthCalledWith(4, { type: 'REQUEST_SNAPSHOT' });
    expect(worker.postMessage).toHaveBeenNthCalledWith(5, {
      type: 'SET_INTERVAL',
      ms: 2000,
    });
  });

  it('updates snapshot and running when a SNAPSHOT message is received', () => {
    const { result } = renderHook(() => useCounterWorker());
    const worker = MockWorker.instances[0]!;

    const snapshot = {
      running: true,
      totalInputs: 3,
      top: [{ value: 5, count: 2 }],
      lastUpdated: 123456,
    };

    act(() => {
      worker.onmessage?.({
        data: { type: 'SNAPSHOT', payload: snapshot },
      } as unknown as MessageEvent<WorkerEvent>);
    });

    expect(result.current.snapshot).toEqual(snapshot);
    expect(result.current.running).toBe(true);
  });

  it('updates lastFib when a FIB_ALERT message is received', () => {
    const { result } = renderHook(() => useCounterWorker());
    const worker = MockWorker.instances[0]!;

    act(() => {
      worker.onmessage?.({
        data: { type: 'FIB_ALERT', value: 1 },
      } as MessageEvent<WorkerEvent>);
    });

    expect(result.current.lastFib).toBe(1);
  });

  it('handles QUIT_ACK by resetting state and requesting a fresh snapshot', () => {
    const fixedNow = 111111;
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { result } = renderHook(() => useCounterWorker());
    const worker = MockWorker.instances[0]!;

    act(() => {
      worker.onmessage?.({
        data: {
          type: 'SNAPSHOT',
          payload: { running: true, totalInputs: 10, top: [], lastUpdated: 999 },
        },
      } as unknown as MessageEvent<WorkerEvent>);
      worker.onmessage?.({
        data: { type: 'FIB_ALERT', value: 21 },
      } as MessageEvent<WorkerEvent>);
    });

    expect(result.current.snapshot).toEqual({
      running: true,
      totalInputs: 10,
      top: [],
      lastUpdated: 999,
    });
    expect(result.current.lastFib).toBe(21);

    worker.postMessage.mockClear();

    act(() => {
      worker.onmessage?.({
        data: { type: 'QUIT_ACK' },
      } as MessageEvent<WorkerEvent>);
    });

    expect(result.current.snapshot).toEqual({
      running: false,
      totalInputs: 0,
      top: [],
      lastUpdated: fixedNow,
    });
    expect(result.current.lastFib).toBeNull();

    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'REQUEST_SNAPSHOT' });
  });

  it('quit() resets snapshot & lastFib and sends QUIT', () => {
    const fixedNow = 222222;
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { result } = renderHook(() => useCounterWorker());
    const worker = MockWorker.instances[0]!;

    act(() => {
      worker.onmessage?.({
        data: {
          type: 'SNAPSHOT',
          payload: { running: true, totalInputs: 7, top: [], lastUpdated: 888 },
        },
      } as unknown as MessageEvent<WorkerEvent>);
      worker.onmessage?.({
        data: { type: 'FIB_ALERT', value: 13 },
      } as MessageEvent<WorkerEvent>);
    });

    worker.postMessage.mockClear();

    act(() => {
      result.current.quit();
    });

    expect(result.current.snapshot).toEqual({
      running: false,
      totalInputs: 0,
      top: [],
      lastUpdated: fixedNow,
    });
    expect(result.current.lastFib).toBeNull();

    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'QUIT' });
  });
});
