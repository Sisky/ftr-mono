import { getIntervalBlurUpdate } from "../utils/intervalUtils";

interface IntervalControlProps {
  intervalStr: string;
  setIntervalStr: (value: string) => void;
  setIntervalMs: (ms: number) => void;
}

export default function IntervalControl(props: IntervalControlProps) {
  const { intervalStr, setIntervalStr, setIntervalMs } = props;

  const sanitizedStr = intervalStr.replace(/\s+/g, '');
  const n = Number(sanitizedStr);
  const isInteger = Number.isInteger(n);
  const isValid = Number.isFinite(n) && isInteger && n >= 1;

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#444' }}>
        Interval (s):
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          pattern="[0-9]*"
          value={intervalStr}
          aria-invalid={!isValid}
          aria-describedby="interval-error"
          onKeyDown={(e) => {
            // Disallow characters that could create negative or non-integer values
            const badKeys = ['e', 'E', '+', '-', '.'];
            if (badKeys.includes(e.key)) {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            const digitsOnly = text.replace(/\D+/g, '');
            // Allow empty paste to clear; otherwise set sanitized digits
            if (digitsOnly !== text) {
              e.preventDefault();
              setIntervalStr(digitsOnly);
            }
          }}
          onChange={(e) => {
            const raw = e.target.value;
            const next = raw.replace(/\s+/g, '');

            setIntervalStr(next);
            const n2 = Number(next);
            if (Number.isFinite(n2) && n2 >= 1) {
              setIntervalMs(Math.floor(n2 * 1000));
            }
          }}
          onBlur={() => {
            const update = getIntervalBlurUpdate(intervalStr);
            if (!update) return;

            setIntervalStr(update.intervalStr);
            setIntervalMs(update.intervalMs);
          }}
          style={{
            width: 100,
            padding: '8px 10px',
            borderRadius: 8,
            border: `1px solid ${isValid ? '#ddd' : '#f66'}`,
            outlineColor: isValid ? undefined : '#f66',
          }}
          title="Change snapshot interval (seconds) - applies immediately"
        />
        {!isValid && (
          <span id="interval-error" style={{ color: '#c0392b', fontSize: 11 }}>
            Enter a whole number ≥ 1
          </span>
        )}
      </label>
    </div>
  );
}
