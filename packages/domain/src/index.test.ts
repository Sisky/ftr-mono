import { Counter, makeFibonacciSet } from './index';
import { describe, expect, test } from 'vitest';

describe('Counter', () => {
    test('counts and snapshots', () => {
        const c = new Counter();
        [3, 3, 2, 5, 3, 2].forEach(n => c.add(n));
        const rows = c.snapshot();
        expect(rows).toEqual([
            { value: 3, count: 3 },
            { value: 2, count: 2 },
            { value: 5, count: 1 },
        ]);
        expect(c.total).toBe(6);
    });

    test('limit handling', () => {
        const c = new Counter();
        [1, 2, 2, 3, 3, 3].forEach(n => c.add(n));
        expect(c.snapshot(2).map(r => r.value)).toEqual([3, 2]);
        expect(c.snapshot(0)).toEqual([]);
        expect(c.snapshot(NaN).length).toBe(3);
    });

    test('get() returns 0 for unseen values', () => {
        const c = new Counter();
        expect(c.get(42)).toBe(0);
    });

    test('clear() empties counts and resets total', () => {
        const c = new Counter();
        [1, 1, 2].forEach(n => c.add(n));
        expect(c.total).toBe(3);
        expect(c.snapshot().length).toBe(2);
        c.clear();
        expect(c.total).toBe(0);
        expect(c.snapshot()).toEqual([]);
        expect(c.get(1)).toBe(0);
    });

    test('snapshot sorting tie-breaker by value asc when counts equal', () => {
        const c = new Counter();
        // Make 2 and 3 have same count
        [3, 2, 3, 2].forEach(n => c.add(n));
        const rows = c.snapshot();
        expect(rows).toEqual([
            { value: 2, count: 2 },
            { value: 3, count: 2 },
        ]);
    });

    test('snapshot limit: negative => [], > total => all, undefined => all', () => {
        const c = new Counter();
        [1, 2, 2, 3].forEach(n => c.add(n));
        expect(c.snapshot(-5)).toEqual([]);
        const all = c.snapshot(undefined);
        expect(all.map(r => r.value)).toEqual([2, 1, 3]);
        const big = c.snapshot(999);
        expect(big).toEqual(all);
    });

    test('snapshot on empty counter returns []', () => {
        const c = new Counter();
        expect(c.snapshot()).toEqual([]);
    });
});

describe('makeFibSet', () => {
    test('contains first terms', () => {
        const s = makeFibonacciSet(10);
        [0, 1, 1, 2, 3, 5, 8, 13, 21, 34].forEach(n => expect(s.has(n)).toBe(true));
    });

    test('check non finite and <= 0 return empty', () => {
        expect(makeFibonacciSet(-1).size).toBe(0);
        expect(makeFibonacciSet(0).size).toBe(0);
        expect(makeFibonacciSet(NaN as unknown as number).size).toBe(0);
        expect(makeFibonacciSet(Infinity as unknown as number).size).toBe(0);
    });

    test('count 1 returns only 0', () => {
        const s = makeFibonacciSet(1);
        expect(s.has(0)).toBe(true);
        expect(s.has(1)).toBe(false);
        expect(Array.from(s)).toEqual([0]);
    });

    test('excludes non-Fibonacci numbers', () => {
        const s = makeFibonacciSet(15);
        [4, 6, 7, 9, 10, 11, 12, 14].forEach(n => expect(s.has(n)).toBe(false));
    });
});