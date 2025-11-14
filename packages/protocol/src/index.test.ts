import { describe, it, expect } from 'vitest';
import type { CountRow as DomainCountRow } from '@ftr-mono/domain';
import type { Command, Snapshot, WorkerEvent, CountRow } from './index';

// Utility functions used purely for type-compatibility tests
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function acceptsCountRow(_row: CountRow) { /* noop */ }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function acceptsDomainCountRow(_row: DomainCountRow) { /* noop */ }

describe('@ftr-mono/protocol types', () => {
    it('CountRow re-exports the domain CountRow shape and is mutually assignable', () => {
        const domainRow: DomainCountRow = { value: 42n, count: 3 };
        const protocolRow: CountRow = { value: 1n, count: 2 };

        acceptsCountRow(domainRow);
        acceptsDomainCountRow(protocolRow);

        // runtime sanity on property names
        expect(Object.keys(protocolRow).sort()).toEqual(['count', 'value']);
    });

    it('Command union accepts all valid command shapes', () => {
        const start: Command = { type: 'START' };
        const halt: Command = { type: 'HALT' };
        const resume: Command = { type: 'RESUME' };
        const quit: Command = { type: 'QUIT' };
        const input: Command = { type: 'INPUT_NUMBER', value: 123n };
        const request: Command = { type: 'REQUEST_SNAPSHOT' };
        const setIntervalCmd: Command = { type: 'SET_INTERVAL', ms: 250 };

        // minimal runtime checks to ensure the discriminant is present as specified
        expect(start.type).toBe('START');
        expect(halt.type).toBe('HALT');
        expect(resume.type).toBe('RESUME');
        expect(quit.type).toBe('QUIT');
        expect(input.value).toBe(123n);
        expect(request.type).toBe('REQUEST_SNAPSHOT');
        expect(setIntervalCmd.ms).toBe(250);
    });

    it('Command union rejects invalid shapes at compile-time', () => {
        // @ts-expect-error missing value for INPUT_NUMBER
        const badInput: Command = { type: 'INPUT_NUMBER' };
        void badInput;
        // @ts-expect-error wrong property name for SET_INTERVAL
        const badInterval: Command = { type: 'SET_INTERVAL', interval: 10 };
        void badInterval;
        // @ts-expect-error unknown command type
        const badType: Command = { type: 'PAUSE' };
        void badType;
    });

    it('Snapshot type exposes the expected readonly shape', () => {
        const s: Snapshot = {
            running: true,
            totalInputs: 5,
            top: [
                { value: 2n, count: 3 },
                { value: 1n, count: 2 },
            ],
            lastUpdated: Date.now(),
        };

        // runtime shape checks
        expect(typeof s.running).toBe('boolean');
        expect(typeof s.totalInputs).toBe('number');
        expect(Array.isArray(s.top)).toBe(true);
        expect(s.top[0]).toEqual({ value: 2n, count: 3 });
        expect(typeof s.lastUpdated).toBe('number');
    });

    it('WorkerEvent union accepts valid event variants and rejects invalid ones', () => {
        const snapEvt: WorkerEvent = {
            type: 'SNAPSHOT',
            payload: {
                running: false,
                totalInputs: 0,
                top: [],
                lastUpdated: 0,
            },
        };
        const fibEvt: WorkerEvent = { type: 'FIB_ALERT', value: 34n };
        const quitAck: WorkerEvent = { type: 'QUIT_ACK' };

        expect(snapEvt.type).toBe('SNAPSHOT');
        expect(fibEvt.value).toBe(34n);
        expect(quitAck.type).toBe('QUIT_ACK');

        // invalid variants (compile-time only)
        // @ts-expect-error payload must be Snapshot shape
        const badSnap: WorkerEvent = { type: 'SNAPSHOT', payload: { running: true } };
        void badSnap;
        // @ts-expect-error wrong event discriminant
        const badEvt: WorkerEvent = { type: 'ALERT', value: 1 };
        void badEvt;
    });
});
