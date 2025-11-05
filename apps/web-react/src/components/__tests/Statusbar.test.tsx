import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import StatusBar from '../StatusBar.tsx';

afterEach(() => {
  cleanup();
});

const baseProps = {
  running: true,
  totalInputs: 0,
  lastUpdated: null as number | null,
  fibToast: null as number | null,
};

describe('StatusBar', () => {
  it('shows Running status with total inputs and no last update', () => {
    render(<StatusBar {...baseProps} totalInputs={5}/>);

    const statusContainer = screen.getByText('Status:', { exact: false });

    expect(statusContainer).toHaveTextContent('Status: Running');
    expect(statusContainer).toHaveTextContent('Total inputs: 5');
    expect(statusContainer).toHaveTextContent('Last update:');
  });

  it('shows Halted when running is false', () => {
    render(<StatusBar {...baseProps} running={false}/>);

    expect(screen.getByText('Status:', { exact: false })).toHaveTextContent('Status: Halted');
  });

  it('shows a formatted time when lastUpdated is provided', () => {
    const timestamp = new Date('2024-01-01T12:34:56Z').getTime();

    render(<StatusBar {...baseProps} lastUpdated={timestamp}/>);

    const lastUpdateEl = screen.getByText('Last update:');

    expect(lastUpdateEl).not.toHaveTextContent('Last update: abc');
  });

  it('does not render FIB pill when fibToast is null', () => {
    render(<StatusBar {...baseProps} fibToast={null}/>);

    expect(screen.queryByText('FIB:')).toBeNull();
  });

  it('renders FIB pill when fibToast has a value', () => {
    render(<StatusBar {...baseProps} fibToast={1}/>);

    expect(screen.getByText('FIB: 1')).toBeInTheDocument();
  });
});
