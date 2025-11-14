interface StatusBarProps {
  running: boolean;
  totalInputs: number;
  lastUpdated: number | null;
  fibToast: string | null;
}

export default function StatusBar(props: StatusBarProps) {
  const { running, totalInputs, lastUpdated, fibToast } = props;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
      <div>
        Status: {running ? 'Running' : 'Halted'} ·{' '}
        <strong>Total inputs:</strong> {totalInputs} ·{' '}
        <strong>Last update:</strong> {lastUpdated != null ? new Date(lastUpdated).toLocaleTimeString() : ''}
      </div>

      {fibToast != null && (
        <div
          style={{
            marginLeft: 'auto',
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid #ddd',
            fontWeight: 600,
          }}
        >
          FIB: {fibToast}
        </div>
      )}
    </div>
  );
}
