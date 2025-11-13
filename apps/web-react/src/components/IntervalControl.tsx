interface IntervalControlProps {
  intervalStr: string;
  setIntervalStr: (value: string) => void;
  setIntervalMs: (ms: number) => void;
}

export default function IntervalControl(props: IntervalControlProps) {
  const { intervalStr, setIntervalStr, setIntervalMs } = props;

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#444' }}>
        Interval (s):
        <input
          type="number"
          min={1}
          step={1}
          value={intervalStr}
          onChange={(e) => {
            const v = e.target.value;
            setIntervalStr(v);
            const n = Number(v);
            if (Number.isFinite(n) && n >= 1) {
              // Convert seconds to milliseconds for the worker
              setIntervalMs(Math.floor(n * 1000));
            }
          }}
          style={{ width: 100, padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
          title="Change snapshot interval (seconds) - applies immediately"
        />
      </label>
    </div>
  );
}
