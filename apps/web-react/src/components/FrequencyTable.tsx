import type { CountRow } from '@ftr-mono/protocol';

interface FrequencyTableProps {
  rows: readonly CountRow[] | CountRow[];
}

export default function FrequencyTable(props: FrequencyTableProps) {
  const { rows } = props;

  if (!rows?.length) {
    return <div style={{ opacity: 0.7 }}>No inputs yet.</div>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
      <tr>
        <th style={{ textAlign: 'left' }}>#</th>
        <th style={{ textAlign: 'left' }}>Value</th>
        <th style={{ textAlign: 'right' }}>Count</th>
      </tr>
      </thead>
      <tbody>
      {rows.map((r, i) => (
        <tr key={r.value}>
          <td>{i + 1}</td>
          <td>{r.value}</td>
          <td style={{ textAlign: 'right' }}>{r.count}</td>
        </tr>
      ))}
      </tbody>
    </table>
  );
}
