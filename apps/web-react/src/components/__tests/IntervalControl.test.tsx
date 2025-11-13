import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import IntervalControl from '../IntervalControl.tsx';

afterEach(() => {
  cleanup();
});

const renderWithMocks = (intervalStr = '5') => {
  const setIntervalStr = vi.fn();
  const setIntervalMs = vi.fn();

  render(
    <IntervalControl
      intervalStr={intervalStr}
      setIntervalStr={setIntervalStr}
      setIntervalMs={setIntervalMs}
    />,
  );

  const input = screen.getByLabelText(/Interval \(s\):/);

  return { input, setIntervalStr, setIntervalMs };
};

describe('IntervalControl', () => {
  it('uses intervalStr as the controlled value', () => {
    const { input } = renderWithMocks('15');

    expect(input).toHaveValue(15);
  });

  it('calls both setters for a valid integer value', () => {
    const { input, setIntervalStr, setIntervalMs } = renderWithMocks('5');

    fireEvent.change(input, { target: { value: '2' } });

    expect(setIntervalStr).toHaveBeenCalledWith('2');
    expect(setIntervalMs).toHaveBeenCalledWith(2000);
  });

  it('floors a valid float value before calling setIntervalMs', () => {
    const { input, setIntervalStr, setIntervalMs } = renderWithMocks('5');

    fireEvent.change(input, { target: { value: '1.9' } });

    expect(setIntervalStr).toHaveBeenCalledWith('1.9');
    expect(setIntervalMs).toHaveBeenCalledWith(1900);
  });

  it('does not call setIntervalMs for non-numeric values', () => {
    const { input, setIntervalStr, setIntervalMs } = renderWithMocks('5');

    fireEvent.change(input, { target: { value: 'abc' } });

    // browser wont actually let abc happen
    expect(setIntervalStr).toHaveBeenCalledWith('');
    expect(setIntervalMs).not.toHaveBeenCalled();
  });

  it('does not call setIntervalMs for values less than 1', () => {
    const { input, setIntervalStr, setIntervalMs } = renderWithMocks('5');

    fireEvent.change(input, { target: { value: '0' } });

    expect(setIntervalStr).toHaveBeenCalledWith('0');
    expect(setIntervalMs).not.toHaveBeenCalled();
  });

  it('does not call setIntervalMs for an empty string', () => {
    const { input, setIntervalStr, setIntervalMs } = renderWithMocks('5');

    fireEvent.change(input, { target: { value: '' } });

    expect(setIntervalStr).toHaveBeenCalledWith('');
    expect(setIntervalMs).not.toHaveBeenCalled();
  });
});
