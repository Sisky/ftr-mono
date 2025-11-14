/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Helpers to manipulate global BigInt without using `any`
const getGlobalBigInt = () => (globalThis as unknown as { BigInt: typeof BigInt }).BigInt;
const defineGlobalBigInt = (value: typeof BigInt) => {
  Reflect.defineProperty(globalThis as object, 'BigInt', {
    value,
    configurable: true,
    writable: true,
  });
};

type SnapshotRow = {
  value: number;
  count: number;
};

type Snapshot = {
  running: boolean;
  totalInputs: number;
  top: SnapshotRow[];
  lastUpdated: number;
};

type UseCounterWorkerResult = {
  snapshot: Snapshot | null;
  lastFib: number | null;
  lastFibTick: number;
  quitAckTick: number;
  running: boolean;
  inputNumber: (n: number) => void;
  halt: () => void;
  resume: () => void;
  refresh: () => void;
  quit: () => void;
  setIntervalMs: (ms: number) => void;
};

import App from '../App.tsx';

const useCounterWorkerMock = vi.fn();

vi.mock('../hooks/useCounterWorker', () => ({
  useCounterWorker: () => useCounterWorkerMock(),
}));

let mockInputNumber: ReturnType<typeof vi.fn>;
let mockHalt: ReturnType<typeof vi.fn>;
let mockResume: ReturnType<typeof vi.fn>;
let mockRefresh: ReturnType<typeof vi.fn>;
let mockQuit: ReturnType<typeof vi.fn>;
let mockSetIntervalMs: ReturnType<typeof vi.fn>;

const buildHookReturn = (overrides: Partial<UseCounterWorkerResult> = {},
) => ({
  snapshot: { running: true, totalInputs: 0, top: [], lastUpdated: Date.now() },
  lastFib: null,
  lastFibTick: 0,
  quitAckTick: 0,
  running: true,
  inputNumber: mockInputNumber,
  halt: mockHalt,
  resume: mockResume,
  refresh: mockRefresh,
  quit: mockQuit,
  setIntervalMs: mockSetIntervalMs,
  ...overrides,
});

beforeEach(() => {
  mockInputNumber = vi.fn();
  mockHalt = vi.fn();
  mockResume = vi.fn();
  mockRefresh = vi.fn();
  mockQuit = vi.fn();
  mockSetIntervalMs = vi.fn();

  useCounterWorkerMock.mockReset();
  useCounterWorkerMock.mockReturnValue(buildHookReturn());
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('App', () => {
  it('renders the main heading', () => {
    render(<App/>);

    expect(
      screen.getByRole('heading', { name: 'React + Web Worker (Counter)' })
    ).toBeInTheDocument();
  });

  it('submits a valid integer and clears the input', () => {
    render(<App/>);

    const input = screen.getByPlaceholderText(/enter an integer/i) as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.click(addButton);

    expect(mockInputNumber).toHaveBeenCalledWith(42n);

    expect(input.value).toBe('');

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows validation error and does not submit for non-integer input', () => {
    render(<App/>);

    const input = screen.getByPlaceholderText(/enter an integer/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(addButton);

    expect(mockInputNumber).not.toHaveBeenCalled();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter an integer (no decimals or letters).'
    );
  });

  it('accepts large integers (beyond safe integer) and submits', () => {
    render(<App/>);

    const input = screen.getByPlaceholderText(/enter an integer/i) as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: /add/i });

    // One above Number.MAX_SAFE_INTEGER
    fireEvent.change(input, { target: { value: '9007199254740993' } });
    fireEvent.click(addButton);

    expect(mockInputNumber).toHaveBeenCalledWith(9007199254740993n);

    // Input clears on success and no alert is shown
    expect(input.value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('displays and auto-hides FIB toast when lastFib is provided', async () => {
    useCounterWorkerMock.mockReturnValue(
      buildHookReturn({
        snapshot: { running: true, totalInputs: 1, top: [], lastUpdated: Date.now() },
        lastFib: 21,
      })
    );

    render(<App/>);

    expect(screen.getByText('FIB: 21')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText('FIB: 21')).not.toBeInTheDocument();
      },
      { timeout: 2000, interval: 50 }
    );
  });


  it('handles a null snapshot from the worker (branch coverage)', () => {
    // Force the hook to return no snapshot and not running
    useCounterWorkerMock.mockReturnValue(
      buildHookReturn({
        snapshot: null,
        running: false,
      }),
    );

    render(<App/>);

    // StatusBar should show halted, 0 total inputs, and "no last update"
    const status = screen.getByText(/Status:/);
    expect(status).toHaveTextContent('Status: Halted');
    expect(status).toHaveTextContent('Total inputs: 0');
    expect(status).toHaveTextContent('Last update:');

    // FrequencyTable should fall back to [] and show the empty state
    expect(screen.getByText(/No inputs yet\./i)).toBeInTheDocument();
  });

  it('does not submit when BigInt throws inside submit handler (branch coverage)', () => {
    render(<App/>);

    const input = screen.getByPlaceholderText(/enter an integer/i) as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: /add/i });

    // type a valid-looking integer so regex validation passes using the real BigInt
    fireEvent.change(input, { target: { value: '123' } });

    const originalBigInt = getGlobalBigInt();
    try {
      defineGlobalBigInt((() => { throw new Error('boom'); }) as unknown as typeof BigInt);

      fireEvent.click(addButton);

      expect(mockInputNumber).not.toHaveBeenCalled();
      expect(input.value).toBe('123');
    } finally {
      defineGlobalBigInt(originalBigInt);
    }
  });

  it('shows BigInt-specific validation message when BigInt throws for valid-looking input (branch coverage)', () => {
    const originalBigInt = getGlobalBigInt();
    try {
      defineGlobalBigInt((() => { throw new Error('boom'); }) as unknown as typeof BigInt);

      render(<App/>);

      const input = screen.getByPlaceholderText(/enter an integer/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '456' } });

      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid integer value.');

      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);
      expect(mockInputNumber).not.toHaveBeenCalled();
    } finally {
      defineGlobalBigInt(originalBigInt);
    }
  });
});

describe('App farewell overlay', () => {
  it('does not show the farewell overlay when quitAckTick is 0', () => {
    useCounterWorkerMock.mockReturnValue(
      buildHookReturn({
        quitAckTick: 0,
        snapshot: { running: true, totalInputs: 2, top: [], lastUpdated: Date.now() },
      })
    );

    render(<App />);

    expect(screen.queryByText('Farewell!')).toBeNull();
    expect(screen.queryByRole('button', { name: 'OK' })).toBeNull();
  });

  it('shows the farewell overlay when quitAckTick > 0 and OK triggers reload', () => {
    const reloadSpy = vi.fn();

    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      writable: true,
    });

    useCounterWorkerMock.mockReturnValue(
      buildHookReturn({
        quitAckTick: 1,
        snapshot: {
          running: false,
          totalInputs: 3,
          top: [
            { value: 5, count: 2 },
            { value: 1, count: 1 },
          ],
          lastUpdated: Date.now(),
        },
      })
    );

    render(<App />);

    const farewellHeading = screen.getByText('Farewell!');
    expect(farewellHeading).toBeInTheDocument();
    expect(screen.getByText(/numbers you entered/i)).toBeInTheDocument();

    const card = farewellHeading.closest('div') as HTMLElement;
    const table = within(card).getByRole('table');
    const rows = within(table).getAllByRole('row');

    expect(rows.length).toBe(3);
    expect(rows[1]).toHaveTextContent('1');
    expect(rows[1]).toHaveTextContent('5');
    expect(rows[1]).toHaveTextContent('2');
    expect(rows[2]).toHaveTextContent('2');
    expect(rows[2]).toHaveTextContent('1');
    expect(rows[2]).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
