import { useCounterWorker } from './hooks/useCounterWorker';
import FrequencyTable from './components/FrequencyTable';
import { useEffect, useRef, useState } from 'react';
import IntervalControl from './components/IntervalControl';
import ControlsBar from './components/ControlsBar';
import ValidationMessage from './components/ValidationMessage';
import StatusBar from './components/StatusBar';

export default function App() {
  const [input, setInput] = useState('');
  const [fibToast, setFibToast] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [intervalStr, setIntervalStr] = useState('1');

  const { snapshot, lastFib, lastFibTick, quitAckTick, inputNumber, halt, resume, refresh, quit, running, setIntervalMs } = useCounterWorker();

  const [showFarewell, setShowFarewell] = useState(false);

  useEffect(() => {
    if (quitAckTick > 0) {
      setShowFarewell(true);
    }
  }, [quitAckTick]);


  useEffect(() => {
    if (lastFib != null) {
      setFibToast(lastFib);
      const t = setTimeout(() => setFibToast(null), 1500);
      return () => clearTimeout(t);
    }
  }, [lastFibTick, lastFib]);

  const submit = () => {
    const str = input.trim();

    // - okay, one or more digits
    if (str === '' || !/^-?\d+$/.test(str)) {
      return;
    }

    const num = Number(str);

    if (Number.isSafeInteger(num)) {
      inputNumber(num);
      // Clear only on successful submission
      setInput('');
      inputRef.current?.focus();
    }
  };

  const s = input.trim();
  let validationMsg: string | null = null;
  if (s !== '') {
    if (!/^-?\d+$/.test(s)) {
      validationMsg = 'Please enter an integer (no decimals or letters).';
    } else {
      const n = Number(s);
      if (!Number.isSafeInteger(n)) {
        validationMsg = 'Value must be a safe integer.';
      }
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 16 }}>
      <h1>React + Web Worker (Counter)</h1>

      <IntervalControl
        intervalStr={intervalStr}
        setIntervalStr={setIntervalStr}
        setIntervalMs={setIntervalMs}
      />

      <ControlsBar
        inputRef={inputRef}
        input={input}
        setInput={setInput}
        onSubmit={submit}
        running={running}
        halt={halt}
        resume={resume}
        refresh={refresh}
        quit={quit}
      />

      <ValidationMessage message={validationMsg}/>

      <StatusBar
        running={running}
        totalInputs={snapshot?.totalInputs ?? 0}
        lastUpdated={snapshot ? snapshot.lastUpdated : null}
        fibToast={fibToast}
      />

      <FrequencyTable rows={snapshot?.top ?? []}/>

      {showFarewell && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 'min(680px, 90vw)' }}>
            <h2 style={{ marginTop: 0 }}>Farewell!</h2>
            <p>Here are the numbers you entered and their frequencies:</p>
            <div style={{ maxHeight: 320, overflow: 'auto', marginBottom: 16 }}>
              <FrequencyTable rows={snapshot?.top ?? []} />
            </div>
            <p>The application will restart when you press OK.</p>
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => window.location.reload()}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
