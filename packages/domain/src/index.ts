export type CountRow = { value: number; count: number; }

/**
 * Build a Set containing the first `count` Fibonacci numbers.
 *
 * - Uses BigInt internally for exact arithmetic to avoid precision loss.
 * - The Set is used for O(1) membership checks.
 * - For count <= 0, returns an empty set.
 *
 * @param count Number of Fibonacci terms to generate (defaults to 1000).
 * @returns A Set<bigint> of Fibonacci value.
 */
export function makeFibonacciSet(count: number = 1000): Set<bigint> {
    const fibNumbers = new Set<bigint>();

    if (!Number.isFinite(count) || count <= 0) {
        return fibNumbers;
    }

    let prev = 0n;
    let curr = 1n;

    // always add 0
    fibNumbers.add(prev);

    if (count === 1) {
        return fibNumbers;
    }

    fibNumbers.add(curr);

    for (let generated = 2; generated <= count; generated++) {
        const next = prev + curr;
        fibNumbers.add(next);
        prev = curr;
        curr = next;
    }

    return fibNumbers;
}

export class Counter {
    private counts: Map<number, number> = new Map();

    public total: number = 0;

    /**
     * @param value to count.
     * @returns The updated count for that value.
     */
    add(value: number): number {
        const prev = this.counts.get(value) ?? 0;
        const next = prev + 1;
        this.counts.set(value, next);
        this.total += 1;
        return next;
    }

    /**
     * @param value to check.
     * @returns Count of that value, 0 if not there.
     */
    get(value: number): number | undefined {
        return this.counts.get(value) ?? 0;
    }

    /**
     * Clear the count
     */
    clear() {
        this.counts.clear();
        this.total = 0;
    }

    /**
     * Produce a sorted snapshot of the current value frequencies.
     * Sorting:
     *  - Higher 'count' first
     *  - Tiebreaker: smaller 'value' first (asc)
     *  Limit:
     *   - Undefined, NaN, not finite returns *all* rows
     *   - Limit < 0 returns []
     *   - Limit > total size returns up to total size
     *
     * @param limit Optional maximum number of rows to include in the snapshot.
     * @returns Array of CountRow, sorted as described
     */
    snapshot(limit?: number): CountRow[] {
        const total = this.counts.size;
        if (total === 0) {
            return [];
        }

        // Filter non-negative, or total 'all'
        const normalisedLimit = Number.isFinite(limit as number) ? Math.floor(limit as number) : total;
        if (normalisedLimit === 0) {
            return [];
        }

        // Clamp to valid range
        const clampedLimit = Math.max(0, Math.min(normalisedLimit, total));
        if (clampedLimit === 0) {
            return [];
        }

        const pairs = Array.from(this.counts.entries());
        pairs.sort((left, right) => {
            const [leftValue, leftCount] = left;
            const [rightValue, rightCount] = right;

            if (rightCount !== leftCount) {
                return rightCount - leftCount;
            }

            return leftValue - rightValue;
        });

        const visiblePairs = clampedLimit >= total ? pairs : pairs.slice(0, clampedLimit);

        return visiblePairs.map(([value, count]) => ({ value, count }));
    }
}

