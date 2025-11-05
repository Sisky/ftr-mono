import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ControlsBar from '../ControlsBar.tsx';
import { createRef } from 'react';

afterEach(() => {
  cleanup();
});

const baseCallbacks = () => ({
  setInput: vi.fn(),
  onSubmit: vi.fn(),
  halt: vi.fn(),
  resume: vi.fn(),
  refresh: vi.fn(),
  quit: vi.fn(),
});

const renderControlsBar = (running = true, input = '') => {
  const inputRef = createRef<HTMLInputElement | null>();
  const callbacks = baseCallbacks();

  render(
    <ControlsBar
      inputRef={inputRef}
      input={input}
      setInput={callbacks.setInput}
      onSubmit={callbacks.onSubmit}
      running={running}
      halt={callbacks.halt}
      resume={callbacks.resume}
      refresh={callbacks.refresh}
      quit={callbacks.quit}
    />,
  );

  const inputEl = screen.getByPlaceholderText(/Enter an integer/i);

  return { inputEl, ...callbacks };
};

describe('ControlsBar', () => {
  it('uses the input prop as the controlled value and calls setInput on change', () => {
    const { inputEl, setInput } = renderControlsBar(true, '123');

    // Controlled value
    expect(inputEl).toHaveValue('123');

    fireEvent.change(inputEl, { target: { value: '456' } });
    expect(setInput).toHaveBeenCalledWith('456');
  });

  it('calls onSubmit when the Add button is clicked', () => {
    const { onSubmit } = renderControlsBar();

    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit when Enter is pressed in the input', () => {
    const { inputEl, onSubmit } = renderControlsBar();

    fireEvent.keyDown(inputEl, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows Halt button when running and calls halt on click', () => {
    const { halt } = renderControlsBar(true);

    const haltButton = screen.getByRole('button', { name: /halt/i });
    expect(haltButton).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resume/i })).toBeNull();

    fireEvent.click(haltButton);
    expect(halt).toHaveBeenCalledTimes(1);
  });

  it('shows Resume button when not running and calls resume on click', () => {
    const { resume } = renderControlsBar(false);

    const resumeButton = screen.getByRole('button', { name: /resume/i });
    expect(resumeButton).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /halt/i })).toBeNull();

    fireEvent.click(resumeButton);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('calls refresh and quit when their buttons are clicked', () => {
    const { refresh, quit } = renderControlsBar();

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    fireEvent.click(screen.getByRole('button', { name: /quit/i }));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(quit).toHaveBeenCalledTimes(1);
  });
});
