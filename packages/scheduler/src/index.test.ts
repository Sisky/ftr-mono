import { describe, expect, test, vi } from 'vitest';
import { createIntervalScheduler } from './index';

describe('createIntervalScheduler', () => {
    test('start and stop schedule ticks', () => {
        vi.useFakeTimers();

        const onTick = vi.fn();

        const scheduler = createIntervalScheduler({
            intervalMs: 1000,
            onTick,
            setIntervalFn: (fn, ms) => setInterval(fn, ms),
            clearIntervalFn: (handle) => clearInterval(handle as NodeJS.Timeout),
        });

        expect(scheduler.running).toBe(false);

        scheduler.start();
        expect(scheduler.running).toBe(true);

        vi.advanceTimersByTime(3000);
        expect(onTick).toHaveBeenCalledTimes(3);

        scheduler.stop();
        expect(scheduler.running).toBe(false);

        vi.advanceTimersByTime(2000);

        expect(onTick).toHaveBeenCalledTimes(3);

        vi.useRealTimers();
    });

    test('start is idempotent and stop is safe when not running', () => {
        vi.useFakeTimers();
        const onTick = vi.fn();
        const scheduler = createIntervalScheduler({
            intervalMs: 100,
            onTick,
            setIntervalFn: (fn, ms) => setInterval(fn, ms),
            clearIntervalFn: (handle) => clearInterval(handle as NodeJS.Timeout),
        });

        // stop before start should be safe
        scheduler.stop();
        expect(scheduler.running).toBe(false);

        // start twice should not create duplicate intervals
        scheduler.start();
        scheduler.start();
        expect(scheduler.running).toBe(true);
        vi.advanceTimersByTime(350);
        expect(onTick).toHaveBeenCalledTimes(3);

        // stopping twice should be safe
        scheduler.stop();
        expect(scheduler.running).toBe(false);
        scheduler.stop();
        expect(scheduler.running).toBe(false);

        vi.useRealTimers();
    });

    test('setIntervalMs while running restarts with new interval', () => {
        vi.useFakeTimers();
        const onTick = vi.fn();
        const scheduler = createIntervalScheduler({
            intervalMs: 1000,
            onTick,
            setIntervalFn: (fn, ms) => setInterval(fn, ms),
            clearIntervalFn: (handle) => clearInterval(handle as NodeJS.Timeout),
        });

        scheduler.start();
        // After 1 tick at 1000 ms
        vi.advanceTimersByTime(1000);
        expect(onTick).toHaveBeenCalledTimes(1);

        // Change the interval to 200 ms; should restart and tick accordingly
        scheduler.setIntervalMs(200);
        // Immediately after the change, no extra tick has happened yet
        expect(onTick).toHaveBeenCalledTimes(1);
        // Now advance time to observe faster ticks
        vi.advanceTimersByTime(1000);
        // 1000/200=5 ticks added
        expect(onTick).toHaveBeenCalledTimes(1 + 5);

        scheduler.stop();
        vi.useRealTimers();
    });

    test('setIntervalMs while stopped applies on next start', () => {
        vi.useFakeTimers();
        const onTick = vi.fn();
        const scheduler = createIntervalScheduler({
            intervalMs: 1000,
            onTick,
            setIntervalFn: (fn, ms) => setInterval(fn, ms),
            clearIntervalFn: (handle) => clearInterval(handle as NodeJS.Timeout),
        });

        // Update while stopped
        scheduler.setIntervalMs(250);
        scheduler.start();
        vi.advanceTimersByTime(1000);
        expect(onTick).toHaveBeenCalledTimes(4); // 0,250,500,750,1000 -> 4 intervals completed

        scheduler.stop();
        vi.useRealTimers();
    });

    test('setIntervalMs clamps and ignores invalid values', () => {
        vi.useFakeTimers();
        const onTick = vi.fn();
        const scheduler = createIntervalScheduler({
            intervalMs: 10,
            onTick,
            setIntervalFn: (fn, ms) => setInterval(fn, ms),
            clearIntervalFn: (handle) => clearInterval(handle as NodeJS.Timeout),
        });

        scheduler.setIntervalMs(0); // clamps to 1
        scheduler.start();
        vi.advanceTimersByTime(10);
        expect(onTick).toHaveBeenCalledTimes(10); // 10 ms / 1 ms

        // Now try to set NaN - should be ignored and keep previous 1 ms
        scheduler.setIntervalMs(Number.NaN as unknown as number);
        vi.advanceTimersByTime(5);
        expect(onTick).toHaveBeenCalledTimes(15);

        scheduler.stop();
        vi.useRealTimers();
    });
});
