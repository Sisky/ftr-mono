import { expect, it } from 'vitest';
import { getIntervalBlurUpdate } from './intervalUtils';

it('clamps invalid/too small values to 1 second', () => {
  expect(getIntervalBlurUpdate('0')).toEqual({ intervalStr: '1', intervalMs: 1000 });
  expect(getIntervalBlurUpdate('abc')).toEqual({ intervalStr: '1', intervalMs: 1000 });
});

it('floors non-integer values', () => {
  expect(getIntervalBlurUpdate('2.9')).toEqual({ intervalStr: '2', intervalMs: 2000 });
});

it('removes whitespace and updates ms (sanitized !== raw branch)', () => {
  expect(getIntervalBlurUpdate('  5  ')).toEqual({ intervalStr: '5', intervalMs: 5000 });
});

it('does nothing for clean valid integers', () => {
  expect(getIntervalBlurUpdate('10')).toBeNull();
});
