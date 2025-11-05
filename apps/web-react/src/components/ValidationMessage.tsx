interface ValidationMessageProps {
  message: string | null;
}

export default function ValidationMessage(props: ValidationMessageProps) {
  const { message } = props;

  if (!message) return null;

  return (
    <div role="alert" aria-live="polite" style={{ color: '#b00020', fontSize: 12, margin: '4px 0 12px 0' }}>
      {message}
    </div>
  );
}
