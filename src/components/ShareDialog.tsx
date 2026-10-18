import { useEffect, useRef, useState } from 'react';
import { encodeExperiment, type Experiment } from '../experiment';

export default function ShareDialog({
  experiment,
  onClose,
}: {
  experiment: Experiment;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const returnFocus = useRef(
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const [status, setStatus] = useState('');
  const url = new URL(window.location.href);
  url.hash = encodeExperiment(experiment);
  const link = url.toString();
  useEffect(() => {
    dialog.current?.showModal();
    input.current?.select();
    const element = dialog.current;
    return () => {
      element?.close();
      returnFocus.current?.focus();
    };
  }, []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setStatus('Copied. Your experiment is ready to share.');
    } catch {
      input.current?.focus();
      input.current?.select();
      setStatus(
        'Automatic copying is unavailable. Copy the selected link with Ctrl+C or Command+C.',
      );
    }
  }
  return (
    <dialog
      ref={dialog}
      className="share-dialog"
      aria-labelledby="share-heading"
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled)',
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="share-content">
        <div className="panel-heading">
          <h2 id="share-heading">Pass the experiment along.</h2>
          <button
            className="remove-button"
            aria-label="Close share dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p>
          This link includes your waves, phases, mute settings, and graph views.
          It opens with sound off and a low default volume.
        </p>
        <label htmlFor="experiment-link">Experiment link</label>
        <input
          id="experiment-link"
          ref={input}
          readOnly
          value={link}
          onFocus={(event) => event.currentTarget.select()}
        />
        <button className="play-button" onClick={copy}>
          Copy link
        </button>
        <p role="status" className="share-status">
          {status || 'No account needed. The settings live in the link.'}
        </p>
      </div>
    </dialog>
  );
}
