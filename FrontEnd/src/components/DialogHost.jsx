import { useEffect, useState } from 'react';
import { registerDialogHandler } from '../services/dialog';

export default function DialogHost() {
  const [queue, setQueue] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    const unregister = registerDialogHandler((payload) => {
      setQueue((prev) => [...prev, payload]);
    });

    return unregister;
  }, []);

  useEffect(() => {
    if (dialog || queue.length === 0) return;

    const nextDialog = queue[0];
    setQueue((prev) => prev.slice(1));
    setPromptValue(nextDialog.defaultValue || '');
    setDialog(nextDialog);
  }, [dialog, queue]);

  if (!dialog) return null;

  const closeWith = (value) => {
    dialog.resolve(value);
    setDialog(null);
    setPromptValue('');
  };

  const iconMap = {
    success: '✓',
    danger: '!',
    warning: '!',
    info: 'i',
  };

  return (
    <div className="app-dialog-overlay" onClick={() => closeWith(dialog.type === 'confirm' ? false : null)}>
      <div className="app-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className={`app-dialog-icon tone-${dialog.tone || 'info'}`}>
          {iconMap[dialog.tone] || 'i'}
        </div>
        <h3>{dialog.title}</h3>
        <p>{dialog.message}</p>

        {dialog.type === 'prompt' && (
          <input
            className="app-dialog-input"
            type={dialog.inputType || 'text'}
            placeholder={dialog.placeholder || ''}
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            autoFocus
          />
        )}

        <div className="app-dialog-actions">
          {(dialog.type === 'confirm' || dialog.type === 'prompt') && (
            <button type="button" className="app-dialog-btn ghost" onClick={() => closeWith(dialog.type === 'confirm' ? false : null)}>
              {dialog.cancelText || 'Hủy'}
            </button>
          )}
          <button
            type="button"
            className={`app-dialog-btn primary tone-${dialog.tone || 'info'}`}
            onClick={() => closeWith(dialog.type === 'prompt' ? promptValue : true)}
          >
            {dialog.confirmText || 'Đóng'}
          </button>
        </div>
      </div>
    </div>
  );
}
