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
  const [intervalStr, setIntervalStr] = useState('5');

  const { snapshot, lastFib, lastFibTick, inputNumber, halt, resume, refresh, quit, running, setIntervalMs } = useCounterWorker();


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
    </div>
  );
}
