import type { CountRow as DomainCountRow } from '@ftr-mono/domain';

/**
 * Public CountRow type re-exported from the domain package.
 * Keeps UIs depending only on @ftr-mono/protocol for shapes.
 */
export type CountRow = DomainCountRow;

/**
 * Commands the main thread can send to the worker.
 */
export type Command =
    | { type: 'START' }
    | { type: 'HALT' }
    | { type: 'RESUME' }
    | { type: 'QUIT' }
    | { type: 'INPUT_NUMBER'; value: number }
    | { type: 'REQUEST_SNAPSHOT' }
    | { type: 'SET_INTERVAL'; ms: number };

/**
 * Snapshot of counter state that the worker sends back.
 */
export type Snapshot = {
    /** Whether the periodic scheduler is currently running. */
    running: boolean;

    /** Total number of input values recorded so far. */
    totalInputs: number;

    /** Top rows, already sorted by count desc, then value asc. */
    top: ReadonlyArray<CountRow>;

    /** Time the snapshot was generated (epoch milliseconds). */
    lastUpdated: number;
};

/**
 * Events emitted by the worker.
 */
export type WorkerEvent =
    | { type: 'SNAPSHOT'; payload: Snapshot }
    | { type: 'FIB_ALERT'; value: number }
    | { type: 'QUIT_ACK' };
