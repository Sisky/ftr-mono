/**
 * - `start` begins calling `onTick` repeatedly.
 * - `stop` stops calling `onTick`.
 * - `running` reflects whether the scheduler is currently active.
 */
export interface IntervalScheduler {
    readonly running: boolean;
    start(): void;
    stop(): void;

    /**
     * Update the interval in milliseconds. If running, the scheduler restarts immediately
     * with the new interval; if stopped, the new interval is applied on next start.
     */
    setIntervalMs(ms: number): void;
}

/**
 * We inject these so the scheduler works in any JS environment
 * (browser, worker, Node etc.).
 */
export type IntervalEnvironment = {
    setIntervalFn: (fn: () => void, ms: number) => unknown;
    clearIntervalFn: (handle: unknown) => void;
};

/**
 * Calls `onTick` every `intervalMs` while running.
 */
export function createIntervalScheduler(options: {
    intervalMs: number;
    onTick: () => void;
} & IntervalEnvironment): IntervalScheduler {
    const { intervalMs, onTick, setIntervalFn, clearIntervalFn } = options;

    let currentMs = intervalMs;
    let intervalHandle: unknown = null;
    let isRunning = false;

    const start = () => {
        if (intervalHandle != null) {
            return;
        }
        intervalHandle = setIntervalFn(onTick, currentMs);
        isRunning = true;
    };

    const stop = () => {
        if (intervalHandle == null) {
            return;
        }
        clearIntervalFn(intervalHandle);
        intervalHandle = null;
        isRunning = false;
    };

    const setIntervalMs = (ms: number) => {
        const next = Math.max(1, Math.floor(ms));
        currentMs = Number.isFinite(next) ? next : currentMs;
        if (isRunning) {
            // Restart timer with new interval immediately
            stop();
            start();
        }
    };

    return {
        get running() {
            return isRunning;
        },
        start,
        stop,
        setIntervalMs,
    };
}