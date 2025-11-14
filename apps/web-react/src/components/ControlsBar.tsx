import React from 'react';

interface ControlsBarProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  input: string | bigint;
  setInput: (value: string) => void;
  onSubmit: () => void;
  running: boolean;
  halt: () => void;
  resume: () => void;
  refresh: () => void;
  quit: () => void;
}

export default function ControlsBar(props: ControlsBarProps) {
  const { inputRef, input, setInput, onSubmit, running, halt, resume, refresh, quit } = props;

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
      <input
        ref={inputRef}
        value={String(input)}
        onChange={(e) => {
          const raw = e.target.value;
          const sanitized = raw.replace(/\s+/g, '');
          setInput(sanitized);
        }}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        placeholder="Enter an integer…"
        inputMode="numeric"
        style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd' }}
      />

      <button onClick={onSubmit}>Add</button>

      {
        running ? <button onClick={halt}>Halt</button> : <button onClick={resume}>Resume</button>
      }

      <button onClick={refresh}>Refresh</button>
      <button onClick={quit}>Quit</button>
    </div>
  );
}
