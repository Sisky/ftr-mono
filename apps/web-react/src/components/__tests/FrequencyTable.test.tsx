import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import FrequencyTable from '../FrequencyTable';

afterEach(() => {
  cleanup();
});

describe('FrequencyTable', () => {
  it('renders empty state when there are no rows', () => {
    render(<FrequencyTable rows={[]}/>);

    // Shows the "no inputs" message
    expect(screen.getByText(/No inputs yet\./i)).toBeInTheDocument();
    // No table should be rendered
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('renders a table with headers and rows when data is provided', () => {
    const rows = [
      { value: 5n, count: 2 },
      { value: 7n, count: 3 },
    ];

    render(<FrequencyTable rows={rows}/>);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();

    // First row: index 1, value 5, count 2
    const value5Cell = screen.getByText('5');
    const row1 = value5Cell.closest('tr')!;
    expect(within(row1).getByText('1')).toBeInTheDocument();
    expect(within(row1).getByText('2')).toBeInTheDocument();

    // Second row: index 2, value 7, count 3
    const value7Cell = screen.getByText('7');
    const row2 = value7Cell.closest('tr')!;
    expect(within(row2).getByText('2')).toBeInTheDocument();
    expect(within(row2).getByText('3')).toBeInTheDocument();
  });
});
