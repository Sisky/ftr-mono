import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ValidationMessage from '../ValidationMessage.tsx';

afterEach(() => {
  cleanup();
});

describe('Validation Message', () => {
  it('Render a test message', () => {
    render(<ValidationMessage message="Test Message"/>);

    expect(screen.getByRole('alert')).toHaveTextContent('Test Message');
  });

  it('Confirm no message', () => {
    render(<ValidationMessage message={null}/>);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Does not render for empty string', () => {
    render(<ValidationMessage message="" />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Has correct aria attributes', () => {
    render(<ValidationMessage message="Test Message" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });
});

