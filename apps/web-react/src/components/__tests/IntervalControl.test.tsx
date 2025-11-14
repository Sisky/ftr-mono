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

  it('prevents disallowed keys in onKeyDown and allows digits', () => {
    const { input } = renderWithMocks('5');

    const badKeys = ['e', 'E', '+', '-', '.'] as const;
    for (const key of badKeys) {
      fireEvent.keyDown(input, { key });
    }

    fireEvent.keyDown(input, { key: '3' });
  });

  it('sanitizes pasted text to digits-only', () => {
    const { input, setIntervalStr } = renderWithMocks('5');

    fireEvent.paste(input, {
      clipboardData: {
        getData: (type: string) => {
          void type;
          return '12x3';
        },
      },
    });

    expect(setIntervalStr).toHaveBeenCalledWith('123');
  });

  it('allows clean digit-only paste without interception', () => {
    const { input, setIntervalStr } = renderWithMocks('5');

    const prevent = vi.fn();
    fireEvent.paste(input, {
      clipboardData: {
        getData: (type: string) => {
          void type;
          return '999';
        },
      },
      preventDefault: prevent,
    });

    expect(prevent).not.toHaveBeenCalled();
    // no immediate setIntervalStr call from onPaste when text is clean
    expect(setIntervalStr).not.toHaveBeenCalled();
  });

  it('clears on paste when text has no digits', () => {
    const { input, setIntervalStr } = renderWithMocks('5');

    fireEvent.paste(input, {
      clipboardData: {
        getData: (type: string) => {
          void type;
          return 'abc';
        },
      },
    });

    // No digits, cleared
    expect(setIntervalStr).toHaveBeenCalledWith('');
  });

  it('onBlur clamps invalid to 1s (string "1") and 1000ms', () => {
    const { input, setIntervalStr, setIntervalMs } = renderWithMocks('0');

    fireEvent.blur(input);

    expect(setIntervalStr).toHaveBeenCalledWith('1');
    expect(setIntervalMs).toHaveBeenCalledWith(1000);
  });

  it('onBlur floors fractional seconds to an integer', () => {
    const setIntervalStr = vi.fn();
    const setIntervalMs = vi.fn();
    const { getByLabelText } = render(
      <IntervalControl
        intervalStr="2.5"
        setIntervalStr={setIntervalStr}
        setIntervalMs={setIntervalMs}
      />
    );

    const input = getByLabelText(/Interval \(s\)/i);
    fireEvent.blur(input);

    expect(setIntervalStr).toHaveBeenCalledWith('2');
    expect(setIntervalMs).toHaveBeenCalledWith(2000);
  });

  it('onBlur normalizes whitespace for valid integers', () => {
    const { input, setIntervalStr, setIntervalMs } = renderWithMocks('  3  ');

    fireEvent.blur(input);

    expect(setIntervalStr).toHaveBeenCalledWith('3');
    expect(setIntervalMs).toHaveBeenCalledWith(3000);
  });

  it('onBlur does nothing when update is null (clean integer)', () => {
    const { input, setIntervalStr, setIntervalMs } = renderWithMocks('10');

    fireEvent.blur(input);

    expect(setIntervalStr).not.toHaveBeenCalled();
    expect(setIntervalMs).not.toHaveBeenCalled();
  });
});
